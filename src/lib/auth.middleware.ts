import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"
import { roles, statement } from "@/lib/permissions"

type Resource = keyof typeof statement

/**
 * A reusable middleware factory that checks if the requesting user
 * has the required action permission on a given resource.
 *
 * @param resource - The resource type (e.g. 'project', 'user')
 * @param action - The action to perform (e.g. 'create', 'update', 'list')
 */
export const requirePermission = <R extends Resource>(
  resource: R,
  action: (typeof statement)[R][number],
) => {
  return createMiddleware().server(async ({ next }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    // In Better Auth, role is typically stored on the user object
    const roleName = (session?.user as any)?.role || "user"

    // Look up the role in our static permissions object
    const roleConfig = roles[roleName as keyof typeof roles]

    // Find the statements for this specific resource
    const allowedActions = (roleConfig?.statements as any)?.[resource] || []

    // If the required action is not in the allowed actions, block the request
    if (!allowedActions.includes(action as any)) {
      throw new Error(`Forbidden: missing ${String(action)} permission for ${String(resource)}`)
    }

    // Success! Pass the session and headers down to the next handler
    return next({ context: { session, headers } })
  })
}
