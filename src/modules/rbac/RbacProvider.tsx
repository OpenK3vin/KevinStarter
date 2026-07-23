import { useMemo, type ReactNode } from "react"

import { authClient } from "@/lib/auth-client"

import { RbacContext } from "./RbacContext"
import type { GlobalRole, RbacContextValue } from "./types"

/** Global role hierarchy — higher index = more permissive. */
const ROLE_RANK: Record<string, number> = {
  user: 0,
  editor: 1,
  admin: 2,
}

type RbacProviderProps = {
  children: ReactNode
}

/**
 * Wraps the app with live session data from better-auth.
 *
 * Place inside `FeatureFlagProvider` in `__root.tsx`.
 *
 * NOTE: UI gating only. Every mutation must re-check server-side with `can()`.
 */
export function RbacProvider({ children }: RbacProviderProps) {
  const { data: session, isPending } = authClient.useSession()

  const value: RbacContextValue = useMemo(() => {
    const user = session?.user
      ? { id: session.user.id, role: (session.user as { role?: string }).role }
      : null

    const userRank = ROLE_RANK[user?.role ?? "user"] ?? 0

    return {
      user,
      isLoading: isPending,
      hasGlobalRole: (role: GlobalRole) => userRank >= (ROLE_RANK[role] ?? 0),
      isAdmin: user?.role === "admin",
    }
  }, [session, isPending])

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>
}
