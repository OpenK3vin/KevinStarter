import { createFileRoute, redirect } from "@tanstack/react-router"

import { getAuthSession } from "@/features/auth/server/authApi"
import { UserDetailPage } from "@/features/users/components/UserDetailPage"

/**
 * /admin/users/$userId — manage a single user's role and resource permissions.
 * Accessible to both admin and super_admin.
 */
export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  beforeLoad: async () => {
    const session = await getAuthSession()
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || (role !== "super_admin" && role !== "admin")) {
      throw redirect({ to: "/" })
    }
    return { session }
  },
  component: UserDetailRoute,
  head: () => ({
    meta: [{ title: "Manage User | Acme Inc." }],
  }),
})

function UserDetailRoute() {
  const { userId } = Route.useParams()
  return <UserDetailPage userId={userId} />
}
