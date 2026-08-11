import { useMutation } from "@tanstack/react-query"
import { z } from "zod"

import { authClient } from "@/lib/auth-client"
import { loginSchema } from "./auth.schemas"

/**
 * ALL auth mutations use authClient (not server functions) because Better Auth
 * sets session cookies via HTTP Set-Cookie response headers. TanStack Start's
 * createServerFn only forwards the response body, not headers, so cookies would
 * never reach the browser if we used auth.api server-side for these operations.
 */

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const { data, error } = await authClient.signIn.email(credentials)
      if (error) throw new Error(error.message ?? "Sign in failed. Please try again.")
      return data
    },
  })
}

export function useVerifyTwoFactorMutation() {
  return useMutation({
    mutationFn: async ({ code, isBackupCode }: { code: string; isBackupCode: boolean }) => {
      if (isBackupCode) {
        const { error } = await authClient.twoFactor.verifyBackupCode({ code })
        if (error) throw new Error(error.message ?? "Invalid backup code.")
      } else {
        const { error } = await authClient.twoFactor.verifyTotp({ code })
        if (error) throw new Error(error.message ?? "Invalid verification code.")
      }
    },
  })
}

export function useSetupTwoFactorMutation() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password })
      if (error) throw new Error(error.message ?? "Failed to initialize 2FA setup.")
      return data
    },
  })
}

export function useVerifySetupMutation() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({ code })
      if (error) throw new Error(error.message ?? "Invalid verification code.")
    },
  })
}
