import { useState } from "react"

import { useQuery } from "@tanstack/react-query"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { authClient } from "@/lib/auth-client"

import { getIcon, parseUserAgent } from "../utils/device.utils"

export function SessionsCard() {
  const { data: currentSession } = authClient.useSession()
  const {
    data: sessions,
    isPending,
    refetch,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions()
      if (error) throw error
      // better-auth v1 listSessions often returns an array of sessions directly, or an array of { session, user }
      // We will normalize it to ensure we always have access to the session fields
      return (data as any[]).map((item) => item.session || item) as Array<{
        id: string
        token: string
        userAgent?: string | null
        ipAddress?: string | null
        updatedAt: string | Date
      }>
    },
  })

  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleRevoke = async (token: string) => {
    setRevokingId(token)
    try {
      const { error } = await authClient.revokeSession({ token })
      if (error) throw error
      toast.success("Session revoked successfully")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke session")
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <Card className="island-shell border-none">
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>Manage your active devices and sessions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sessions?.length ? (
          <div className="space-y-4">
            {sessions.map((session) => {
              const isCurrent = session.token === currentSession?.session.token
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getIcon(session.userAgent)}
                    </div>
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm leading-none font-medium">
                        {parseUserAgent(session.userAgent)}
                        {isCurrent && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress || "Unknown IP"} • Last active:{" "}
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(session.token)}
                      disabled={revokingId === session.token}
                    >
                      {revokingId === session.token ? "Revoking..." : "Revoke"}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">No active sessions found.</p>
        )}
      </CardContent>
    </Card>
  )
}
