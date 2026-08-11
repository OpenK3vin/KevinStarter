import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const verifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
})

export const setupCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
})
