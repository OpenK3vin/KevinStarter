import { createAccessControl } from 'better-auth/plugins/access'

/**
 * Resource actions available across the app.
 * Extend this object as you add new domain resource types.
 *
 * IMPORTANT: keep this file free of server-only imports.
 * Both src/lib/auth.ts (server) and src/lib/auth-client.ts (client)
 * import from here — it must be safe to bundle on either side.
 */
export const statement = {
  project: ['create', 'read', 'update', 'delete'],
  user: ['create', 'ban', 'set-role', 'impersonate'],
} as const

export const ac = createAccessControl(statement)

export const roles = {
  /**
   * super_admin — full platform control, including creating users and
   * managing roles. Only assignable by another super_admin.
   */
  super_admin: ac.newRole({
    project: ['create', 'read', 'update', 'delete'],
    user: ['create', 'ban', 'set-role', 'impersonate'],
  }),
  admin: ac.newRole({
    project: ['create', 'read', 'update', 'delete'],
    user: ['ban', 'set-role'],
  }),
  editor: ac.newRole({
    project: ['create', 'read', 'update'],
  }),
  user: ac.newRole({
    project: ['create', 'read'],
  }),
}
