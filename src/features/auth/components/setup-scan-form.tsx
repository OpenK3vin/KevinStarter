import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAtomValue, useSetAtom } from "jotai"
import { useForm } from "react-hook-form"
import QRCode from "react-qr-code"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { useVerifySetupMutation } from "../api/auth.hooks"
import { setupCodeSchema } from "../api/auth.schemas"
import { stepAtom, totpURIAtom } from "../state/auth.atoms"

export function SetupScanForm() {
  const totpURI = useAtomValue(totpURIAtom)
  const setStep = useSetAtom(stepAtom)
  const verifySetupMutation = useVerifySetupMutation()

  const setupForm = useForm<z.infer<typeof setupCodeSchema>>({
    resolver: zodResolver(setupCodeSchema),
    defaultValues: { code: "" },
  })

  async function onSetupSubmit(values: z.infer<typeof setupCodeSchema>) {
    try {
      await verifySetupMutation.mutateAsync(values.code)
      setStep("setup-backup")
    } catch (err) {
      // Error handled by mutation state
    }
  }

  const isPending = verifySetupMutation.isPending

  return (
    <div className="rise-in space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">Secure Your Account</h1>
        <p className="text-sm text-muted-foreground">Setup Two-Factor Authentication</p>
      </div>
      <Card className="island-shell border-none">
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center rounded-xl border bg-white p-4">
            {totpURI && <QRCode value={totpURI} size={200} />}
          </div>

          <Form {...setupForm}>
            <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-4">
              {verifySetupMutation.error && (
                <div className="text-sm text-destructive">{verifySetupMutation.error.message}</div>
              )}
              <FormField
                control={setupForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        className="h-14 text-center font-mono text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the 6-digit code from your app to verify setup.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
