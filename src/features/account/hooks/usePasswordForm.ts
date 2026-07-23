import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"

import { passwordSchema, type PasswordValues } from "../schemas/password.schema"

export function usePasswordForm(onSuccess?: () => void) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  })

  const handleCancel = () => {
    setIsExpanded(false)
    form.reset()
    setError(null)
  }

  async function onSubmit(values: PasswordValues) {
    setIsSaving(true)
    setError(null)
    try {
      const { error: apiError } = await authClient.changePassword({
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      })
      if (apiError) throw apiError
      // Bust cookie cache so this client re-validates its own session against the DB
      await authClient.getSession({ query: { disableCookieCache: true } })
      toast.success("Password changed successfully")
      form.reset()
      setIsExpanded(false)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  return {
    form,
    isExpanded,
    setIsExpanded,
    isSaving,
    error,
    onSubmit: form.handleSubmit(onSubmit),
    handleCancel,
  }
}
