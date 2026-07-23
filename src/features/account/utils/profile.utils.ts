const AVATAR_COLORS = [
  "oklch(0.651 0.211 18.2)",
  "oklch(0.880 0.147 88.66)",
  "oklch(0.805 0.160 166.42)",
  "oklch(0.583 0.126 241.1)",
  "oklch(0.350 0.083 245.3)",
]

export function getAvatarColor(identifier: string) {
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
