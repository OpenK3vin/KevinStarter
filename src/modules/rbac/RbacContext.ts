import { createContext } from 'react'
import type { RbacContextValue } from './types'

export const RbacContext = createContext<RbacContextValue | null>(null)
