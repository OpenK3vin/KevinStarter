import { useEffect, useState } from "react"

import { useNavigate } from "@tanstack/react-router"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { authClient } from "@/lib/auth-client"

export function EmailCard() {
  const { data: session, isPending, refetch } = authClient.useSession()
  const [isVerifying, setIsVerifying] = useState(false)

  const navigate = useNavigate()
  // Extract search params manually to avoid tying EmailCard tightly to a specific route search schema,
  // or use standard URLSearchParams.
  const searchParams = new URLSearchParams(window.location.search)
  const shouldRefresh = searchParams.get("refresh") === "true"

  const email = session?.user?.email
  const isVerified = session?.user?.emailVerified

  useEffect(() => {
    if (shouldRefresh && !isVerified) {
      // Force bypass of cookie cache after landing from verification email
      authClient.getSession({ query: { disableCookieCache: true } }).then(() => {
        refetch()
        // Remove the query param cleanly
        // @ts-expect-error - Bypassing strict search param types to keep EmailCard route-agnostic
        navigate({ search: (prev: any) => ({ ...prev, refresh: undefined }), replace: true })
      })
    }
  }, [shouldRefresh, isVerified, refetch, navigate])

  const handleVerify = async () => {
    if (!email) return
    setIsVerifying(true)
    try {
      // Use a clean URL without existing query params for the callback
      const callbackURL = `${window.location.origin}${window.location.pathname}?refresh=true`

      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      })
      if (error) throw error
      toast.success("Verification email sent! Check your inbox.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send verification email")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card className="island-shell border-none">
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>The email address associated with your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-10 w-full max-w-sm" />
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm leading-none font-medium">{email}</p>
              <p className="text-sm text-muted-foreground">
                {isVerified ? (
                  <span className="font-medium text-green-600 dark:text-green-500">Verified</span>
                ) : (
                  <span className="font-medium text-yellow-600 dark:text-yellow-500">
                    Unverified
                  </span>
                )}
              </p>
            </div>

            {!isVerified && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? "Sending..." : "Verify Email"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
