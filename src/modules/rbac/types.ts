/** Global roles managed by better-auth's admin plugin. */
export type GlobalRole = "admin" | "editor" | "user"

/** Actions that can be performed on any resource. */
export type ResourceAction = "read" | "create" | "update" | "delete"

/** Per-resource roles stored in the resource_roles table. */
export type ResourceRole = "editor" | "viewer"

/** Minimum user shape required for server-side can() checks. */
export type RbacUser = {
  id: string
  role?: string | null
}

/** Value provided by RbacContext to React components. */
export type RbacContextValue = {
  /** Null when unauthenticated or still loading. */
  user: RbacUser | null
  isLoading: boolean
  /** True if the current user has the given global role or higher (admin > editor > user). */
  hasGlobalRole: (role: GlobalRole) => boolean
  /** True if the current user is a global admin. */
  isAdmin: boolean
}
