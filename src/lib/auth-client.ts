import { adminClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "./permissions"

const isTwoFactorRequired = import.meta.env.VITE_FF_2FA_REQUIRED === "true"

/**
 * Client-side auth client.
 *
 * Use this in React components and hooks — never import from src/lib/auth.ts
 * (that is server-only). This file is safe to bundle on the client.
 */
export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac, roles }),
    // Mirror the server-side guard: only register the twoFactor client plugin
    // when the feature flag is on. When off, sign-in never triggers the
    // twoFactorRedirect event so users flow straight through to the app.
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
  ],
})

export type { Session, User } from "better-auth"
