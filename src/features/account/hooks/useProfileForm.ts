import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"

import { profileSchema, type ProfileValues } from "../schemas/profile.schema"

export function useProfileForm() {
  const { data: session, isPending } = authClient.useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", image: "" },
  })

  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name,
        image: session.user.image || "",
      })
    }
  }, [session?.user, form])

  async function onSubmit(values: ProfileValues) {
    setIsSaving(true)
    setError(null)
    try {
      const { error: apiError } = await authClient.updateUser({
        name: values.name,
        image: values.image || undefined,
      })
      if (apiError) throw apiError
      toast.success("Profile updated successfully")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  return {
    form,
    session,
    isPending,
    isSaving,
    error,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
