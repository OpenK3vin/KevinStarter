import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

/**
 * Layout guard for authenticated routes.
 *
 * Nest any route that requires a signed-in user under `_authenticated`:
 *   src/routes/_authenticated/dashboard.tsx → /dashboard
 *   src/routes/_authenticated/projects/$id.tsx → /projects/$id
 *
 * beforeLoad runs on every navigation — the cookie-cached session keeps
 * this fast (no round-trip to the DB on most requests).
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    // Expose session to child routes via context
    return { session }
  },
  component: () => <Outlet />,
})
