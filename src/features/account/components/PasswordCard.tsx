import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { usePasswordForm } from "../hooks/usePasswordForm"

export function PasswordCard({ hasCredentialAccount }: { hasCredentialAccount: boolean }) {
  const { form, isExpanded, setIsExpanded, isSaving, error, onSubmit, handleCancel } =
    usePasswordForm()

  if (!hasCredentialAccount) {
    return (
      <Card className="island-shell border-none">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You're signed in with Google. No password has been set for this account.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="island-shell border-none transition-all duration-300">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change your password.</CardDescription>
      </CardHeader>

      <CardContent>
        {!isExpanded ? (
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm tracking-widest text-muted-foreground">•••••••••••</p>
            <Button variant="outline" onClick={() => setIsExpanded(true)}>
              Change password
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={onSubmit}
              className="animate-in space-y-4 duration-300 fade-in slide-in-from-top-4"
            >
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

              <FormField
                control={form.control}
                name="revokeOtherSessions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Revoke other sessions</FormLabel>
                      <CardDescription>Sign out of all other devices immediately.</CardDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
