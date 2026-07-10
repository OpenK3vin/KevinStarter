import { useContext } from 'react'
import { RbacContext } from './RbacContext'
import type { GlobalRole, RbacContextValue } from './types'

/**
 * Raw access to the RBAC context.
 * Throws if used outside `<RbacProvider>`.
 *
 * Prefer the specific hooks below for most use-cases.
 */
export function useRbac(): RbacContextValue {
  const ctx = useContext(RbacContext)
  if (!ctx) {
    throw new Error('useRbac must be used within a RbacProvider')
  }
  return ctx
}

/**
 * Returns the current user's global role string, or `null` when unauthenticated.
 *
 * ```tsx
 * const role = useGlobalRole() // 'admin' | 'editor' | 'user' | null
 * ```
 */
export function useGlobalRole(): string | null {
  const { user } = useRbac()
  return user?.role ?? null
}

/**
 * Returns true if the current user has *at least* the given global role.
 *
 * Role hierarchy: admin > editor > user.
 *
 * ```tsx
 * if (useHasGlobalRole('editor')) { /* show edit button *\/ }
 * ```
 */
export function useHasGlobalRole(role: GlobalRole): boolean {
  const { hasGlobalRole } = useRbac()
  return hasGlobalRole(role)
}

/**
 * Convenience shorthand — returns true if the current user is a global admin.
 *
 * ```tsx
 * const isAdmin = useIsAdmin()
 * ```
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useRbac()
  return isAdmin
}
