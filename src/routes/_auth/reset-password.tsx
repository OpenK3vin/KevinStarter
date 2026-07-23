import { useState } from "react"

import { Link, createFileRoute, useRouter } from "@tanstack/react-router"

import { z } from "zod"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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

export const Route = createFileRoute("/_auth/reset-password")({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
})

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function ResetPasswordPage() {
  const router = useRouter()
  const { token } = Route.useSearch()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  // Token is missing — link is broken or already used
  if (!token) {
    return (
      <div className="rise-in space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is missing or has already been used.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  async function onSubmit(values: ResetPasswordValues) {
    setError(null)
    setIsLoading(true)

    const { error: resetError } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    })

    setIsLoading(false)

    if (resetError) {
      setError(resetError.message ?? "Failed to set password. The link may have expired.")
      return
    }

    router.navigate({ to: "/login" })
  }

  return (
    <div className="rise-in space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">Set your password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account</p>
      </div>

      <Card className="island-shell border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">New Password</CardTitle>
          <CardDescription>Enter and confirm your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div
                  id="reset-password-error"
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        id="reset-password-new"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        id="reset-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                id="reset-password-submit"
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Setting password…" : "Set Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
