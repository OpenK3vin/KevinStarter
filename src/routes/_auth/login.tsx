import { useEffect, useState } from "react"

import { Link, createFileRoute, useRouter } from "@tanstack/react-router"

import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import QRCode from "react-qr-code"

import { PasswordInput } from "@/components/custom-ui/password-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const verifySchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code too long"),
})

const setupCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
})

type Step = "login" | "verify-2fa" | "setup-scan" | "setup-backup"

function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("login")

  // Login state
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Verify state
  const [useBackupCode, setUseBackupCode] = useState(false)

  // Setup state
  const [totpURI, setTotpURI] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const verifyForm = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  })

  const setupForm = useForm<z.infer<typeof setupCodeSchema>>({
    resolver: zodResolver(setupCodeSchema),
    defaultValues: { code: "" },
  })

  useEffect(() => {
    const handler = () => {
      setStep("verify-2fa")
    }
    window.addEventListener("two-factor-redirect", handler)
    return () => window.removeEventListener("two-factor-redirect", handler)
  }, [])

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setError(null)
    setIsLoading(true)

    const { data, error: signInError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })

    setIsLoading(false)

    if (signInError) {
      setError(signInError.message ?? "Sign in failed. Please try again.")
      return
    }

    // Give the event loop a tick to ensure the event listener fires if 2FA intercepted
    await new Promise((resolve) => setTimeout(resolve, 0))

    const user = data?.user as any
    if (user && !user.twoFactorEnabled) {
      // 2FA is not enabled, setup inline
      setIsLoading(true)
      const { data: enableData, error: enableError } = await authClient.twoFactor.enable({
        password: values.password,
      })
      setIsLoading(false)

      if (enableError) {
        setError(enableError.message ?? "Failed to initialize 2FA setup.")
        return
      }

      if (enableData?.totpURI) {
        setTotpURI(enableData.totpURI)
        if (enableData.backupCodes) setBackupCodes(enableData.backupCodes)
        setStep("setup-scan")
      }
      return
    }

    if (user && user.twoFactorEnabled) {
      // Should have been handled by the event listener changing step, but safely fallback
      setStep("verify-2fa")
      return
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    })
  }

  async function onVerifySubmit(values: z.infer<typeof verifySchema>) {
    setError(null)
    setIsLoading(true)

    if (useBackupCode) {
      const { error: verifyError } = await authClient.twoFactor.verifyBackupCode({
        code: values.code,
      })
      setIsLoading(false)
      if (verifyError) {
        setError(verifyError.message ?? "Invalid backup code. Please try again.")
        return
      }
    } else {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: values.code,
      })
      setIsLoading(false)
      if (verifyError) {
        setError(verifyError.message ?? "Invalid code. Please try again.")
        return
      }
    }

    await router.invalidate()
    router.navigate({ to: "/" })
  }

  async function onSetupSubmit(values: z.infer<typeof setupCodeSchema>) {
    setError(null)
    setIsLoading(true)

    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code: values.code,
    })

    setIsLoading(false)

    if (verifyError) {
      setError(verifyError.message ?? "Invalid verification code.")
      return
    }

    setStep("setup-backup")
  }

  function handleSetupFinish() {
    router.invalidate()
    router.navigate({ to: "/" })
  }

  if (step === "verify-2fa") {
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
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
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
                          className="text-center font-mono text-2xl tracking-[0.5em]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Verifying…" : "Verify"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode)
                  setError(null)
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

  if (step === "setup-scan") {
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
                {error && <div className="text-sm text-destructive">{error}</div>}
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
                          className="text-center font-mono text-2xl tracking-widest"
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "setup-backup") {
    return (
      <div className="rise-in space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Secure Your Account</h1>
          <p className="text-sm text-muted-foreground">Save your backup codes</p>
        </div>
        <Card className="island-shell border-none">
          <CardHeader>
            <CardTitle>Save Backup Codes</CardTitle>
            <CardDescription>
              If you lose access to your authenticator app, you can use these backup codes to sign
              in. Save them in a secure place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
              {backupCodes.map((code, idx) => (
                <div key={idx}>{code}</div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSetupFinish} className="w-full">
              I have saved my backup codes
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="rise-in space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <Card className="island-shell border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Sign In</CardTitle>
          <CardDescription>Enter your email and password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
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
                    <FormLabel>Password</FormLabel>
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

              <Button id="login-submit" type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 flex items-center before:flex-1 before:border-t before:border-border after:flex-1 after:border-t after:border-border">
            <span className="px-3 text-xs tracking-wider text-muted-foreground uppercase">or</span>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
            Sign in with Google
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          id="login-to-register"
          to="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
