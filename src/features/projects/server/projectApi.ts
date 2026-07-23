import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"

import { projects, resourceRoles } from "@/db/schema"
import { auth } from "@/lib/auth"
import { batchCan, can } from "@/modules/rbac/can"

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createProjectInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
})

const updateProjectInput = createProjectInput.extend({
  id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const createProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => createProjectInput.parse(data))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error("Unauthorized")

    // Must have at least "editor" global role to create a project
    if (session.user.role === "user") {
      throw new Error("Forbidden: only editors can create projects")
    }

    const projectId = crypto.randomUUID()
    const now = new Date()

    // 1. Create project
    await db.insert(projects).values({
      id: projectId,
      name: data.name,
      description: data.description,
      createdAt: now,
    })

    // 2. Grant the creator "editor" access
    await db.insert(resourceRoles).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      resourceType: "project",
      resourceId: projectId,
      role: "editor",
      createdAt: now,
    })

    return { id: projectId }
  })

export const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error("Unauthorized")

  // Fetch all projects (in a real app, you'd paginate this)
  const allProjects = await db.query.projects.findMany()

  // Filter using batchCan
  const projectIds = allProjects.map((p) => p.id)
  const accessMap = await batchCan(session.user, "read", "project", projectIds)

  return allProjects.filter((p) => accessMap.get(p.id))
})

export const getProject = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error("Unauthorized")

    const allowed = await can(session.user, "read", "project", data.id)
    if (!allowed) throw new Error("Forbidden: you cannot view this project")

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, data.id),
    })

    if (!project) throw new Error("Not found")
    return project
  })

export const updateProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateProjectInput.parse(data))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error("Unauthorized")

    const allowed = await can(session.user, "update", "project", data.id)
    if (!allowed) throw new Error("Forbidden: you cannot update this project")

    const [updated] = await db
      .update(projects)
      .set({ name: data.name, description: data.description })
      .where(eq(projects.id, data.id))
      .returning()

    return updated ?? null
  })

export const deleteProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    if (!session) throw new Error("Unauthorized")

    const allowed = await can(session.user, "delete", "project", data.id)
    if (!allowed) throw new Error("Forbidden: you cannot delete this project")

    // Also clean up grants (in a real DB, use ON DELETE CASCADE, but here we do it manually if needed)
    // Actually our schema doesn't have an FK to projects for resourceRoles.resourceId, so we clean it up
    await db.delete(resourceRoles).where(eq(resourceRoles.resourceId, data.id))
    await db.delete(projects).where(eq(projects.id, data.id))

    return { success: true }
  })
