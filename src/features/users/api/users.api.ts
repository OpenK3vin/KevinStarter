import { createServerFn } from "@tanstack/react-start"

import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { projects, resourceRoles } from "@/db/schema"

import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth.middleware"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManagedUser {
  id: string
  name: string
  email: string
  role: string | null
  banned: boolean | null
  banReason: string | null
  createdAt: string
  image: string | null
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: string
}

export interface UpdateRoleInput {
  userId: string
  role: string
}

export interface BanInput {
  userId: string
  reason?: string
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * List all users. Requires 'list' permission on 'user'.
 * (Currently only super_admin)
 */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requirePermission("user", "list")])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    const result = await auth.api.listUsers({
      headers: context.headers,
      query: { limit: 200 },
    })

    // Filter out the requesting user from destructive actions in the UI,
    // but still include them in the list.
    const users = (result as any).users ?? []
    return users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role ?? "user",
      banned: u.banned ?? false,
      banReason: u.banReason ?? null,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      image: u.image ?? null,
    }))
  })

/**
 * Create a new user with an initial role. Requires 'create' permission on 'user'.
 * (Currently only super_admin)
 */
export const createUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "create")])
  .validator((input: CreateUserInput) => input)
  .handler(async ({ data, context }): Promise<ManagedUser> => {
    const validRoles = ["user", "admin", "editor"] as const
    type ValidRole = (typeof validRoles)[number]
    const safeRole = (validRoles as readonly string[]).includes(data.role)
      ? (data.role as ValidRole)
      : "user"

    const result = await auth.api.createUser({
      headers: context.headers,
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: safeRole,
      },
    })

    const u = (result as any).user
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role ?? data.role,
      banned: false,
      banReason: null,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      image: u.image ?? null,
    }
  })

/**
 * Update a user's role. Requires 'set-role' permission on 'user'.
 * (admin and super_admin)
 */
export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "set-role")])
  .validator((input: UpdateRoleInput) => input)
  .handler(async ({ data, context }): Promise<void> => {
    const validRoles = ["user", "admin", "editor"] as const
    type ValidRole = (typeof validRoles)[number]
    const safeRole = (validRoles as readonly string[]).includes(data.role)
      ? (data.role as ValidRole)
      : "user"

    await auth.api.setRole({
      headers: context.headers,
      body: { userId: data.userId, role: safeRole },
    })
  })

/**
 * Ban a user. Requires 'ban' permission on 'user'.
 * (admin and super_admin)
 */
export const banUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "ban")])
  .validator((input: BanInput) => input)
  .handler(async ({ data, context }): Promise<void> => {
    await auth.api.banUser({
      headers: context.headers,
      body: { userId: data.userId, banReason: data.reason },
    })
  })

/**
 * Unban a user. Requires 'ban' permission on 'user'.
 * (admin and super_admin)
 */
export const unbanUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "ban")])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId, context }): Promise<void> => {
    await auth.api.unbanUser({ headers: context.headers, body: { userId } })
  })

/**
 * Delete a user permanently. Requires 'delete' permission on 'user'.
 * (Currently only super_admin)
 */
export const removeUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "delete")])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId, context }): Promise<void> => {
    await auth.api.removeUser({ headers: context.headers, body: { userId } })
  })

// ---------------------------------------------------------------------------
// Get single user
// ---------------------------------------------------------------------------

/**
 * Fetch a single user by ID. Requires 'read' permission on 'user'.
 */
export const getUserById = createServerFn({ method: "GET" })
  .middleware([requirePermission("user", "read")])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId, context }): Promise<ManagedUser> => {
    const result = await auth.api.listUsers({
      headers: context.headers,
      query: { limit: 200 },
    })
    const users = (result as any).users ?? []
    const u = users.find((u: any) => u.id === userId)
    if (!u) throw new Error("User not found")
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role ?? "user",
      banned: u.banned ?? false,
      banReason: u.banReason ?? null,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      image: u.image ?? null,
    }
  })

// ---------------------------------------------------------------------------
// Resource Roles
// ---------------------------------------------------------------------------

export const getUserResources = createServerFn({ method: "GET" })
  .middleware([requirePermission("user", "read")])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // We join with projects to get project names
    const assignments = await db
      .select({
        id: resourceRoles.id,
        resourceId: resourceRoles.resourceId,
        resourceType: resourceRoles.resourceType,
        role: resourceRoles.role,
        projectName: projects.name,
      })
      .from(resourceRoles)
      .leftJoin(projects, eq(resourceRoles.resourceId, projects.id))
      .where(eq(resourceRoles.userId, userId))

    return assignments
  })

const AssignResourceInput = z.object({
  userId: z.string(),
  resourceType: z.enum(["project"]),
  resourceId: z.string(),
  role: z.enum(["editor", "viewer"]),
})

export const assignResourceRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "set-role")])
  .validator((data: unknown) => AssignResourceInput.parse(data))
  .handler(async ({ data }) => {
    // Check if assignment already exists
    const existing = await db.query.resourceRoles.findFirst({
      where: and(
        eq(resourceRoles.userId, data.userId),
        eq(resourceRoles.resourceType, data.resourceType),
        eq(resourceRoles.resourceId, data.resourceId),
      ),
    })

    if (existing) {
      // Update role if exists
      await db
        .update(resourceRoles)
        .set({ role: data.role })
        .where(eq(resourceRoles.id, existing.id))
      return { success: true }
    }

    await db.insert(resourceRoles).values({
      id: crypto.randomUUID(),
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      role: data.role,
      createdAt: new Date(),
    })

    return { success: true }
  })

export const revokeResourceRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("user", "set-role")])
  .validator((assignmentId: string) => assignmentId)
  .handler(async ({ data: assignmentId }) => {
    await db.delete(resourceRoles).where(eq(resourceRoles.id, assignmentId))
    return { success: true }
  })
