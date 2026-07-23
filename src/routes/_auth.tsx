import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"

/**
 * Layout route for unauthenticated pages (login, register).
 * Redirects already-signed-in users to the home page.
 */
export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (session) {
      throw redirect({ to: "/" })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
