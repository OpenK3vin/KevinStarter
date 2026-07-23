import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import { FeatureFlagContext } from "./FeatureFlagContext"
import type { FeatureFlagContextValue, FeatureFlags } from "./types"

type FeatureFlagProviderProps = {
  children: ReactNode
  flags: FeatureFlags
}

export function FeatureFlagProvider({ children, flags: initialFlags }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(initialFlags)

  // Sync when env flags change (e.g., from Vite HMR)
  useEffect(() => {
    setFlags((prev) => {
      const next = { ...prev, ...initialFlags }
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        return next
      }
      return prev
    })
  }, [initialFlags])

  const setFlag = useCallback((key: string, value: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: value }))
  }, [])

  const isEnabled = useCallback(
    (key: string) => {
      return flags[key] ?? false
    },
    [flags],
  )

  const value: FeatureFlagContextValue = useMemo(
    () => ({
      flags,
      setFlag,
      isEnabled,
    }),
    [flags, setFlag, isEnabled],
  )

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}
