import { useState, useEffect } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Monitor, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { listUserAccounts, listSessions } from "@/features/auth/server/authApi"
import { PageLayout } from "@/components/layout/page-layout"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_authenticated/account/")({
  loader: async ({ context: { queryClient } }) => {
    const [accounts, sessions] = await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ["userAccounts"],
        queryFn: () => listUserAccounts(),
      }),
      queryClient.ensureQueryData({
        queryKey: ["userSessions"],
        queryFn: () => listSessions(),
      }),
    ])
    return { accounts, sessions }
  },
  component: AccountPage,
})

const AVATAR_COLORS = [
  "oklch(0.651 0.211 18.2)", // #ef476f
  "oklch(0.880 0.147 88.66)", // #ffd166
  "oklch(0.805 0.160 166.42)", // #06d6a0
  "oklch(0.583 0.126 241.1)", // #118ab2
  "oklch(0.350 0.083 245.3)", // #073b4c
]

function getAvatarColor(identifier: string) {
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
})
type ProfileValues = z.infer<typeof profileSchema>

const securitySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
type SecurityValues = z.infer<typeof securitySchema>

function AccountPage() {
  const router = useRouter()
  const { data: accounts } = useSuspenseQuery({
    queryKey: ["userAccounts"],
    queryFn: () => listUserAccounts(),
  })

  // Profile Card
  const { data: session, isPending } = authClient.useSession()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (session?.user) {
      profileForm.reset({ name: session.user.name })
    }
  }, [session?.user, profileForm])

  async function onProfileSubmit(values: ProfileValues) {
    setIsSavingProfile(true)
    setProfileError(null)
    try {
      const { error } = await authClient.updateUser({ name: values.name })
      if (error) throw error
      toast.success("Profile updated successfully")
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile")
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Security Card
  const hasCredentialAccount = accounts?.some((a) => a.providerId === "credential")
  const [isSavingSecurity, setIsSavingSecurity] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)

  const securityForm = useForm<SecurityValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onSecuritySubmit(values: SecurityValues) {
    setIsSavingSecurity(true)
    setSecurityError(null)
    try {
      const { error } = await authClient.changePassword({
        newPassword: values.newPassword,
        currentPassword: values.currentPassword,
        revokeOtherSessions: false, // Handled separately in the active sessions card now
      })
      if (error) throw error
      toast.success("Password changed successfully")
      securityForm.reset()
    } catch (e) {
      setSecurityError(e instanceof Error ? e.message : "Failed to change password")
    } finally {
      setIsSavingSecurity(false)
    }
  }

  // Active Sessions
  const { data: sessions } = useSuspenseQuery({
    queryKey: ["userSessions"],
    queryFn: () => listSessions(),
  })

  const currentSessionToken = session?.session?.token

  async function handleRevokeSession(token: string) {
    try {
      const { error } = await authClient.revokeSession({ token })
      if (error) throw error
      toast.success("Session revoked")
      router.invalidate()
    } catch (e) {
      toast.error("Failed to revoke session")
    }
  }

  return (
    <PageLayout title="Account" description="Manage your account settings" className="max-w-2xl">
      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="island-shell border-none">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  {profileError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {profileError}
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    <Avatar className="size-20 rounded-xl" style={{ backgroundColor: getAvatarColor(profileForm.watch("name") || session?.user?.name || "U") }}>
                      <AvatarFallback className="bg-transparent text-xl font-medium text-white">
                        {(profileForm.watch("name") || session?.user?.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Security Card */}
        {hasCredentialAccount && (
          <Card className="island-shell border-none">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Change your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                  {securityError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {securityError}
                    </div>
                  )}

                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSavingSecurity}>
                    {isSavingSecurity ? "Saving..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Active Sessions Card */}
        <Card className="island-shell border-none">
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage the devices you are logged in on.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions?.map((s) => {
                const isCurrent = s.token === currentSessionToken
                const isMobile = s.userAgent?.toLowerCase().includes("mobile")
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-4 shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {isMobile ? (
                          <Smartphone className="size-5 text-muted-foreground" />
                        ) : (
                          <Monitor className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                          {s.userAgent || "Unknown Device"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.ipAddress} • {new Date(s.createdAt).toLocaleDateString()}
                          {isCurrent && (
                            <span className="ml-2 text-green-500 font-medium">(Current Session)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRevokeSession(s.token)}
                        title="Revoke session"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
