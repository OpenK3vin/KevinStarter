import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin as adminPlugin } from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import nodemailer from "nodemailer"

import { db } from "@/db"
import * as schema from "@/db/schema"

import { ac, roles } from "@/lib/permissions"

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 1025,
  secure: false, // true for 465, false for other ports
})

export const auth = betterAuth({
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
  },
  emailVerification: {
    sendOnSignUp: false, // Wait for them to click "Verify Email" in Account Settings
    sendVerificationEmail: async ({ user, url }) => {
      await transporter.sendMail({
        from: '"Acme" <noreply@acme.inc>',
        to: user.email,
        subject: "Verify your email address",
        html: `Click the link to verify your email: <a href="${url}">${url}</a>`,
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    adminPlugin({
      ac,
      roles,
      defaultRole: "user",
      adminRole: ["super_admin", "admin"],
    }),
    tanstackStartCookies(), // must be last
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
