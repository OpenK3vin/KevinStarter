import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "@tanstack/react-router"
import { useAtom } from "jotai"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { verifySchema } from "../api/auth.schemas"
import { useVerifyTwoFactorMutation } from "../api/auth.hooks"
import { useBackupCodeAtom } from "../state/auth.atoms"

export function Verify2FAForm() {
  const router = useRouter()
  const [useBackupCode, setUseBackupCode] = useAtom(useBackupCodeAtom)
  const verifyMutation = useVerifyTwoFactorMutation()

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  })

  async function onVerifySubmit(values: z.infer<typeof verifySchema>) {
    try {
      await verifyMutation.mutateAsync({
        code: values.code,
        isBackupCode: useBackupCode,
      })

      await router.invalidate()
      router.navigate({ to: "/" })
    } catch (err) {
      // Handled by useMutation error state
    }
  }

  const isPending = verifyMutation.isPending

  return (
    <div className="rise-in space-y-6">
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-primary"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Two-Factor Auth</h1>
        <p className="text-sm text-muted-foreground">
          {useBackupCode
            ? "Enter one of your saved backup codes"
            : "Enter the 6-digit code from your authenticator app"}
        </p>
      </div>

      <Card className="island-shell border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Verification</CardTitle>
          <CardDescription>
            {useBackupCode
              ? "Use a backup code to access your account"
              : "Open your authenticator app and enter the code shown"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
              {verifyMutation.error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {verifyMutation.error.message}
                </div>
              )}

              <FormField
                control={verifyForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{useBackupCode ? "Backup Code" : "Authentication Code"}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode={useBackupCode ? "text" : "numeric"}
                        autoComplete="one-time-code"
                        placeholder={useBackupCode ? "xxxxxxxx-xxxx" : "000000"}
                        maxLength={useBackupCode ? 20 : 6}
                        className="h-14 text-center font-mono text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Verifying…" : "Verify"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode)
                verifyMutation.reset()
                verifyForm.reset()
              }}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Lost your device? Use a backup code"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
