import { useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"

import { LoginForm } from "@/features/auth/components/login-form"
// @feature:two-factor:start
import { SetupBackupForm } from "@/features/auth/components/setup-backup-form"
import { SetupScanForm } from "@/features/auth/components/setup-scan-form"
import { Verify2FAForm } from "@/features/auth/components/verify-2fa-form"
// @feature:two-factor:end
import { stepAtom } from "@/features/auth/state/auth.atoms"

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign In" },
      { name: "description", content: "Sign in to your KevinStarter account" },
    ],
  }),
})

function LoginPage() {
  const [step, setStep] = useAtom(stepAtom)

  // @feature:two-factor:start
  // Listen for the custom event dispatched by Better Auth's twoFactor client
  // plugin to seamlessly transition the UI when 2FA verification is required.
  useEffect(() => {
    const handler = () => setStep("verify-2fa")
    window.addEventListener("two-factor-redirect", handler)
    return () => window.removeEventListener("two-factor-redirect", handler)
  }, [setStep])
  // @feature:two-factor:end

  return (
    <div className="mx-auto mt-8 w-full max-w-sm px-4">
      {step === "login" && <LoginForm />}
      {/* @feature:two-factor:start */}
      {step === "verify-2fa" && <Verify2FAForm />}
      {step === "setup-scan" && <SetupScanForm />}
      {step === "setup-backup" && <SetupBackupForm />}
      {/* @feature:two-factor:end */}
    </div>
  )
}
