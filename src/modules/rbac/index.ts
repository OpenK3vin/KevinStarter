// Types
export type { GlobalRole, ResourceAction, ResourceRole, RbacUser, RbacContextValue } from './types'

// Server-only authorization helpers (import only in server functions / loaders)
export { can, batchCan } from './can'

// Client-side provider + hooks
export { RbacProvider } from './RbacProvider'
export { useRbac, useGlobalRole, useHasGlobalRole, useIsAdmin } from './useCan'
