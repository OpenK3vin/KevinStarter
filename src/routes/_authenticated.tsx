import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { getAuthSession } from "@/features/auth/server/authApi"
import { getEnvFlags } from "@/modules/feature-flags/envFlags"

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
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const session = await getAuthSession()
    if (!session) {
      throw redirect({ to: "/login" })
    }

    // 2FA enforcement: redirect to setup only when the flag is on and the
    // user hasn't enrolled yet — except when they're already going there.
    const flags = getEnvFlags()
    const twoFactorEnabled = (session.user as any)?.twoFactorEnabled ?? false
    const isSetupRoute = location.pathname.startsWith("/two-factor/setup")

    if (flags.twoFactorRequired && !twoFactorEnabled && !isSetupRoute) {
      throw redirect({ to: "/two-factor/setup" })
    }

    // Expose session to child routes via context
    return { session }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
