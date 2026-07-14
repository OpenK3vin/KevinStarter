import { createFileRoute, redirect } from '@tanstack/react-router'
import { getAuthSession } from '@/features/auth/server/authApi'
import { UserManagementDashboard } from '@/features/users/components/UserManagementDashboard'

/**
 * /admin/users — super_admin only.
 *
 * Any user who is not super_admin is redirected to the root route.
 * The session is passed through context so the dashboard can read it
 * without an extra network round-trip.
 */
export const Route = createFileRoute('/_authenticated/admin/users')({
  beforeLoad: async () => {
    const session = await getAuthSession()
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      throw redirect({ to: '/' })
    }
    return { session }
  },
  component: UserManagementDashboard,
  head: () => ({
    meta: [{ title: 'User Management | Acme Inc.' }],
  }),
})
