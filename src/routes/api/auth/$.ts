import { createFileRoute } from "@tanstack/react-router"

import { auth } from "@/lib/auth"

/**
 * Catch-all route that mounts the better-auth request handler.
 *
 * All better-auth endpoints (sign-in, sign-up, sign-out, session, etc.)
 * are served from /api/auth/**.
 *
 * Docs: https://www.better-auth.com/docs/integrations/tanstack-start
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => auth.handler(request),
      POST: async ({ request }: { request: Request }) => auth.handler(request),
    },
  },
})
