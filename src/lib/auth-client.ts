import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "./permissions"

/**
 * Client-side auth client.
 *
 * Use this in React components and hooks — never import from src/lib/auth.ts
 * (that is server-only). This file is safe to bundle on the client.
 */
export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles })],
})

export type { Session, User } from "better-auth"
