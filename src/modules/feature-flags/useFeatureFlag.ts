import { useContext } from "react"

import { FeatureFlagContext } from "./FeatureFlagContext"
import type { FeatureFlagContextValue } from "./types"

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider")
  }
  return context
}

export function useFeatureFlag(key: string): boolean {
  const { isEnabled } = useFeatureFlags()
  return isEnabled(key)
}
