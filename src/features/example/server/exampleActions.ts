import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { examples } from "@/db/schema"

import { auth } from "@/lib/auth"
import { can } from "@/modules/rbac/can"

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const updateExampleInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
})

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

/**
 * updateExample — guarded server function.
 *
 * Authorization flow:
 *   1. getSession() — fails fast if no cookie / token.
 *   2. can() — global admin bypasses resource grant check;
 *              otherwise requires an 'editor' grant on this specific example.
 *
 * This is the canonical pattern for all mutations in this codebase.
 * Copy, rename, and adjust the resourceType + action for your own features.
 */
export const updateExample = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateExampleInput.parse(data))
  .handler(async ({ data }) => {
    // 1. Authenticate
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw new Error("Unauthorized")
    }

    // 2. Authorize — requires 'update' on this specific example row
    const allowed = await can(session.user, "update", "example", data.id)
    if (!allowed) {
      throw new Error("Forbidden: you do not have permission to update this example")
    }

    // 3. Mutate
    const [updated] = await db
      .update(examples)
      .set({ name: data.name, description: data.description })
      .where(eq(examples.id, data.id))
      .returning()

    return updated ?? null
  })

/**
 * deleteExample — admin-only server function.
 *
 * Shows how to short-circuit purely on global role when no
 * resource-scoped grant is needed.
 */
export const deleteExample = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) throw new Error("Unauthorized")

    // Only global admins may delete
    if (session.user.role !== "admin") {
      throw new Error("Forbidden: only admins can delete examples")
    }

    await db.delete(examples).where(eq(examples.id, data.id))
    return { success: true }
  })
