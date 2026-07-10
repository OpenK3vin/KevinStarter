// Types
export type { GlobalRole, ResourceAction, ResourceRole, RbacUser, RbacContextValue } from './types'

// Server-only authorization helpers should be imported directly from '@/modules/rbac/can'

// Client-side provider + hooks
export { RbacProvider } from './RbacProvider'
export { useRbac, useGlobalRole, useHasGlobalRole, useIsAdmin } from './useCan'
