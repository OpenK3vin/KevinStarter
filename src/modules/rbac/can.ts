import { and, eq, inArray } from "drizzle-orm"

import { db } from "@/db"

import { resourceRoles } from "@/db/schema"

import { resourceRoleAllows } from "./resourcePermissions"
import type { RbacUser, ResourceAction, ResourceRole } from "./types"

/**
 * Server-only. The unified authorization check.
 *
 * Precedence:
 *   1. Global admin → always allowed (short-circuit, no DB hit).
 *   2. Explicit resource-scoped grant → check action against RESOURCE_ROLE_PERMISSIONS.
 *   3. No grant → denied.
 *
 * Usage inside a server function:
 * ```ts
 * const allowed = await can(session.user, 'update', 'project', data.id)
 * if (!allowed) throw new Error('Forbidden')
 * ```
 */
export async function can(
  user: RbacUser,
  action: ResourceAction,
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  // Global admin bypasses all resource-scoped checks
  if (user.role === "admin" || user.role === "super_admin") return true

  const grant = await db.query.resourceRoles.findFirst({
    where: and(
      eq(resourceRoles.userId, user.id),
      eq(resourceRoles.resourceType, resourceType),
      eq(resourceRoles.resourceId, resourceId),
    ),
  })

  if (!grant) return false

  return resourceRoleAllows(grant.role as ResourceRole, action)
}

/**
 * Server-only. Batch version of `can()` for list views.
 *
 * Returns a Map<resourceId, boolean> so you can check many rows
 * without N+1 queries.
 *
 * ```ts
 * const access = await batchCan(session.user, 'read', 'project', projectIds)
 * const visible = projects.filter(p => access.get(p.id))
 * ```
 */
export async function batchCan(
  user: RbacUser,
  action: ResourceAction,
  resourceType: string,
  resourceIds: string[],
): Promise<Map<string, boolean>> {
  if (resourceIds.length === 0) return new Map()

  // Global admin can do everything
  if (user.role === "admin" || user.role === "super_admin") {
    return new Map(resourceIds.map((id) => [id, true]))
  }

  const grants = await db.query.resourceRoles.findMany({
    where: and(
      eq(resourceRoles.userId, user.id),
      eq(resourceRoles.resourceType, resourceType),
      inArray(resourceRoles.resourceId, resourceIds),
    ),
  })

  const grantMap = new Map(grants.map((g) => [g.resourceId, g.role as ResourceRole]))

  return new Map(
    resourceIds.map((id) => {
      const role = grantMap.get(id)
      return [id, role ? resourceRoleAllows(role, action) : false]
    }),
  )
}
