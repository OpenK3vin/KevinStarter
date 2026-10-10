import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin as adminPlugin } from "better-auth/plugins"
// @feature:two-factor:start
import { twoFactor as twoFactorPlugin } from "better-auth/plugins"
// @feature:two-factor:end
import { tanstackStartCookies } from "better-auth/tanstack-start"
import nodemailer from "nodemailer"

import { db } from "@/db"
import * as schema from "@/db/schema"

import { ac, roles } from "@/lib/permissions"

const isTwoFactorRequired = process.env.VITE_FF_2FA_REQUIRED === "true"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025", 10),
  secure: false, // true for 465, false for other ports
})

export const auth = betterAuth({
  appName: "KevinStarter",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000", "http://localhost:3001"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  session: {
    cookieCache: {
      enabled: false,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // don't block sign in, but allow them to verify later
    sendResetPasswordEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || '"Acme" <noreply@acme.inc>',
        to: user.email,
        subject: "Set your password",
        html: `Click the link to set your password: <a href="${url}">${url}</a>`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: false, // Wait for them to click "Verify Email" in Account Settings
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || '"Acme" <noreply@acme.inc>',
        to: user.email,
        subject: "Verify your email address",
        html: `Click the link to verify your email: <a href="${url}">${url}</a>`,
      })
    },
  },
  // @feature:google:start
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  // @feature:google:end
  plugins: [
    adminPlugin({
      ac,
      roles,
      defaultRole: "user",
      adminRole: ["super_admin", "admin"],
    }),
    // @feature:two-factor:start
    // Only enforce 2FA at the server level when the feature flag is on.
    // Without this guard, users with twoFactorEnabled=true would always get
    // twoFactorRedirect=true on sign-in regardless of the flag.
    ...(isTwoFactorRequired
      ? [
          twoFactorPlugin({
            issuer: "KevinStarter",
          }),
        ]
      : []),
    // @feature:two-factor:end
    tanstackStartCookies(), // must be last
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
