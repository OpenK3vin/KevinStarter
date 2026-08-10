import { useState, useEffect } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import QRCode from "react-qr-code"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PageLayout } from "@/components/layout/page-layout"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/_authenticated/two-factor/setup")({
  component: TwoFactorSetupPage,
})

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

const codeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
})

function TwoFactorSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<"password" | "scan" | "backupCodes">("password")
  const [totpURI, setTotpURI] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  })

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  })

  useEffect(() => {
    const ephem = sessionStorage.getItem("ephemeral_setup_password")
    if (ephem) {
      sessionStorage.removeItem("ephemeral_setup_password")
      passwordForm.setValue("password", ephem)
      onPasswordSubmit({ password: ephem })
    }
  }, [])

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setError(null)
    setIsLoading(true)
    
    // Call Better Auth to generate the TOTP secret and URI
    const { data, error: enableError } = await authClient.twoFactor.enable({
      password: values.password,
    })
    
    setIsLoading(false)

    if (enableError) {
      setError(enableError.message ?? "Failed to verify password.")
      return
    }

    if (data?.totpURI) {
      setTotpURI(data.totpURI)
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes)
      }
      setStep("scan")
    }
  }

  async function onCodeSubmit(values: z.infer<typeof codeSchema>) {
    setError(null)
    setIsLoading(true)

    // Verify the TOTP code to confirm setup
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code: values.code,
    })

    setIsLoading(false)

    if (verifyError) {
      setError(verifyError.message ?? "Invalid verification code.")
      return
    }

    // Successfully verified!
    setStep("backupCodes")
  }
  
  function handleFinish() {
    router.invalidate()
    router.navigate({ to: "/account" })
  }

  return (
    <PageLayout title="Set up Two-Factor Authentication" description="Secure your account with TOTP">
      <div className="max-w-md mx-auto mt-8">
        {step === "password" && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Password</CardTitle>
              <CardDescription>Please enter your password to continue setting up 2FA.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  {error && <div className="text-sm text-destructive">{error}</div>}
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Continue"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "scan" && totpURI && (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center bg-white p-4 rounded-xl border">
                <QRCode value={totpURI} size={200} />
              </div>
              
              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
                  {error && <div className="text-sm text-destructive">{error}</div>}
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono" {...field} />
                        </FormControl>
                        <FormDescription>Enter the 6-digit code from your app to verify setup.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {step === "backupCodes" && (
          <Card>
            <CardHeader>
              <CardTitle>Save Backup Codes</CardTitle>
              <CardDescription>If you lose access to your authenticator app, you can use these backup codes to sign in. Save them in a secure place.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-md font-mono text-sm">
                 {backupCodes.map((code, idx) => (
                   <div key={idx}>{code}</div>
                 ))}
               </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleFinish} className="w-full">I have saved my backup codes</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
