import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PageLayout } from "@/components/layout/page-layout"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/_authenticated/two-factor/manage")({
  component: TwoFactorManagePage,
})

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
})

function TwoFactorManagePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  })

  async function onDisableSubmit(values: z.infer<typeof passwordSchema>) {
    setError(null)
    setIsLoading(true)
    
    const { error: disableError } = await authClient.twoFactor.disable({
      password: values.password,
    })
    
    setIsLoading(false)

    if (disableError) {
      setError(disableError.message ?? "Failed to disable 2FA. Check your password.")
      return
    }

    await router.invalidate()
    router.navigate({ to: "/account" })
  }

  return (
    <PageLayout title="Manage Two-Factor Authentication" description="Disable 2FA for your account">
      <div className="max-w-md mx-auto mt-8">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Disable 2FA</CardTitle>
            <CardDescription>Disabling 2FA will make your account less secure. Please enter your password to confirm.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onDisableSubmit)} className="space-y-4">
                {error && <div className="text-sm text-destructive">{error}</div>}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="destructive" className="w-full" disabled={isLoading}>
                  {isLoading ? "Disabling..." : "Disable Two-Factor Authentication"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
