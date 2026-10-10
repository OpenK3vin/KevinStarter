import { adminClient } from "better-auth/client/plugins"
// @feature:two-factor:start
import { twoFactorClient } from "better-auth/client/plugins"
// @feature:two-factor:end
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "./permissions"

// @feature:two-factor:start
const isTwoFactorRequired = import.meta.env.VITE_FF_2FA_REQUIRED === "true"
// @feature:two-factor:end

/**
 * Client-side auth client.
 *
 * Use this in React components and hooks — never import from src/lib/auth.ts
 * (that is server-only). This file is safe to bundle on the client.
 */
export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac, roles }),
    // @feature:two-factor:start
    ...(isTwoFactorRequired
      ? [
          twoFactorClient({
            // Dispatch custom event so the login page can seamlessly transition to step 2
            onTwoFactorRedirect() {
              window.dispatchEvent(new Event("two-factor-redirect"))
            },
          }),
        ]
      : []),
    // @feature:two-factor:end
  ],
})

export type { Session, User } from "better-auth"
