import type { ResourceAction, ResourceRole } from "./types"

/**
 * Maps each resource-role to the set of actions it may perform.
 *
 * This is code-level configuration — not stored in the DB.
 * If you need runtime-editable permissions, move this to a DB table
 * and query it in can.ts.
 *
 * Keep these in sync with GlobalRole permissions in src/lib/permissions.ts.
 */
export const RESOURCE_ROLE_PERMISSIONS: Record<ResourceRole, ResourceAction[]> = {
  editor: ["read", "create", "update", "delete"],
  viewer: ["read"],
}

/**
 * Returns true if the given resource-role can perform the given action.
 */
export function resourceRoleAllows(role: ResourceRole, action: ResourceAction): boolean {
  return RESOURCE_ROLE_PERMISSIONS[role]?.includes(action) ?? false
}
