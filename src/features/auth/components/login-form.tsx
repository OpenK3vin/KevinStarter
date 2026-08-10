import { useState } from "react"

import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useSetAtom } from "jotai"
import { useForm } from "react-hook-form"

import { PasswordInput } from "@/components/custom-ui/password-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { authClient } from "@/lib/auth-client"

import { useLoginMutation } from "../api/auth.hooks"
import { loginSchema } from "../api/auth.schemas"
import { backupCodesAtom, stepAtom, totpURIAtom } from "../state/auth.atoms"

export function LoginForm() {
  const setStep = useSetAtom(stepAtom)
  const setBackupCodes = useSetAtom(backupCodesAtom)
  const setTotpURI = useSetAtom(totpURIAtom)
  const [googleLoading, setGoogleLoading] = useState(false)

  const loginMutation = useLoginMutation()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const data = await loginMutation.mutateAsync(values)

      // If the user doesn't have 2FA set up yet, initiate inline setup.
      // (If 2FA is already enabled, authClient dispatches "two-factor-redirect"
      //  automatically and login.tsx's event listener handles the step change.)
      const user = data?.user as any
      if (user && !user.twoFactorEnabled) {
        const { data: enableData, error: enableError } = await authClient.twoFactor.enable({
          password: values.password,
        })
        if (enableError) throw new Error(enableError.message ?? "Failed to initialize 2FA setup.")
        if (enableData?.totpURI) {
          setTotpURI(enableData.totpURI)
          if (enableData.backupCodes) setBackupCodes(enableData.backupCodes)
          setStep("setup-scan")
        }
      }
    } catch (err) {
      // Errors surfaced via loginMutation.error
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    })
  }

  const isPending = loginMutation.isPending

  return (
    <div className="rise-in space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <Card className="island-shell border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Sign In</CardTitle>
          <CardDescription>Enter your email and password to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {loginMutation.error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {loginMutation.error.message}
                </div>
              )}

              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <a
                        href="#"
                        className="text-xs text-muted-foreground hover:text-primary hover:underline"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <FormControl>
                      <PasswordInput
                        id="login-password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-zinc-900 hover:bg-zinc-50"
          >
            {googleLoading ? (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
