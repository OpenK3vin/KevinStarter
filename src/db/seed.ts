/**
 * Seed script — populates the database with example data for local testing.
 *
 * Run: pnpm db:seed
 *
 * Safe to re-run — idempotent. Skips users/examples/projects that already exist by name.
 *
 * Users created
 * ─────────────────────────────────────────────────────────────────────────
 *  email                      password       role
 *  superadmin@example.com     Password123!   super_admin  (user management, full control)
 *  admin@example.com          Password123!   admin        (global admin, bypasses RBAC)
 *  editor@example.com         Password123!   editor       (can create projects)
 *  user@example.com           Password123!   user         (regular user, viewer access)
 *
 * Resource grants
 * ─────────────────────────────────────────────────────────────────────────
 *  editor  → editor  on Alpha Project + Gamma Project
 *  editor  → editor  on Example One
 *  user    → viewer  on Beta Project
 *  user    → viewer  on Example Two
 */

import { eq } from "drizzle-orm"

import { auth } from "../lib/auth"
import { db } from "./index"
import { examples, projects, resourceRoles, user } from "./schema"

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_USERS = [
  {
    email: "superadmin@example.com",
    password: "Password123!",
    name: "Super Admin",
    role: "super_admin" as const,
  },
  {
    email: "admin@example.com",
    password: "Password123!",
    name: "Alice Admin",
    role: "admin" as const,
  },
  {
    email: "editor@example.com",
    password: "Password123!",
    name: "Eve Editor",
    role: "editor" as const,
  },
  {
    email: "user@example.com",
    password: "Password123!",
    name: "Bob User",
    role: "user" as const,
  },
]

const SEED_EXAMPLES = [
  {
    name: "Example One",
    description: "First example row — used to demonstrate RBAC read access.",
  },
  {
    name: "Example Two",
    description: "Second example row — assigned as viewer to the regular user.",
  },
  {
    name: "Example Three",
    description: "Third example row — no specific grant; admin-only access.",
  },
]

const SEED_PROJECTS = [
  {
    name: "Alpha Project",
    description: "Infrastructure upgrade — editor Eve has editor access.",
  },
  {
    name: "Beta Project",
    description: "Customer portal v2 — regular user Bob has viewer access.",
  },
  {
    name: "Gamma Project",
    description: "Data pipeline migration — editor Eve has editor access.",
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`)
}

/**
 * Creates a user via better-auth if they don't exist yet.
 *
 * - Queries the DB first so we distinguish "already exists" from actual errors.
 * - After creation the role is applied with a direct DB update, because
 *   signUpEmail always assigns the defaultRole ('user') — better-auth's
 *   admin setRole API would require an authenticated session header.
 */
async function ensureUser(u: (typeof SEED_USERS)[number]) {
  // Check existence BEFORE calling signUpEmail so we don't swallow real errors
  const existing = await db.query.user.findFirst({
    where: eq(user.email, u.email),
  })

  if (existing) {
    log(`⏭️  User already exists, skipping signup: ${u.email}`)
  } else {
    // Create via better-auth (sets password hash, creates session tables, etc.)
    await auth.api.signUpEmail({
      body: { email: u.email, password: u.password, name: u.name },
    })
    log(`✅ Created user: ${u.email}`)
  }

  // Always force-sync the role — handles both fresh creates and re-runs where
  // the role may have been changed manually.
  const currentUser =
    existing ??
    (await db.query.user.findFirst({
      where: eq(user.email, u.email),
    }))

  if (currentUser && currentUser.role !== u.role) {
    await db.update(user).set({ role: u.role }).where(eq(user.email, u.email))
    log(`🔑 Set role '${u.role}' for ${u.email}`)
  } else if (currentUser && currentUser.role === u.role) {
    log(`🔑 Role '${u.role}' already set for ${u.email}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seeding database...\n")

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log("👤 Creating users...")
  for (const u of SEED_USERS) {
    await ensureUser(u)
  }

  // Fetch users to get their IDs for resource role grants
  const allUsers = await db.query.user.findMany()
  const editorUser = allUsers.find((u) => u.email === "editor@example.com")
  const regularUser = allUsers.find((u) => u.email === "user@example.com")

  // ── 2. Examples ───────────────────────────────────────────────────────────
  console.log("\n📄 Creating examples...")

  const allExamples = await db.query.examples.findMany()

  if (allExamples.length > 0) {
    log("⏭️  Examples already exist, skipping seed")
  } else {
    const newExamples = SEED_EXAMPLES.map((e) => ({
      id: crypto.randomUUID(),
      name: e.name,
      description: e.description,
      createdAt: new Date(),
    }))
    await db.insert(examples).values(newExamples)
    newExamples.forEach((e) => log(`✅ ${e.name}`))
    allExamples.push(...(newExamples as any[]))
  }

  const exampleOne = allExamples.find((e) => e.name === "Example One")
  const exampleTwo = allExamples.find((e) => e.name === "Example Two")

  // ── 3. Projects ───────────────────────────────────────────────────────────
  console.log("\n📁 Creating projects...")

  const allProjects = await db.query.projects.findMany()

  if (allProjects.length > 0) {
    log("⏭️  Projects already exist, skipping seed")
  } else {
    const newProjects = SEED_PROJECTS.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      description: p.description,
      createdAt: new Date(),
    }))
    await db.insert(projects).values(newProjects)
    newProjects.forEach((p) => log(`✅ ${p.name}`))
    allProjects.push(...(newProjects as any[]))
  }

  const alphaProject = allProjects.find((p) => p.name === "Alpha Project")
  const betaProject = allProjects.find((p) => p.name === "Beta Project")
  const gammaProject = allProjects.find((p) => p.name === "Gamma Project")

  // ── 4. Resource role grants ───────────────────────────────────────────────
  // resource_roles has a unique index on (userId, resourceType, resourceId),
  // so onConflictDoNothing() correctly deduplicates here.
  console.log("\n🔐 Granting resource roles...")
  const grants = []

  if (editorUser && alphaProject && gammaProject && exampleOne) {
    grants.push(
      {
        id: crypto.randomUUID(),
        userId: editorUser.id,
        resourceType: "project",
        resourceId: alphaProject.id,
        role: "editor",
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: editorUser.id,
        resourceType: "project",
        resourceId: gammaProject.id,
        role: "editor",
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: editorUser.id,
        resourceType: "example",
        resourceId: exampleOne.id,
        role: "editor",
        createdAt: new Date(),
      },
    )
    log(`✅ editor@example.com → editor on Alpha Project, Gamma Project, Example One`)
  }

  if (regularUser && betaProject && exampleTwo) {
    grants.push(
      {
        id: crypto.randomUUID(),
        userId: regularUser.id,
        resourceType: "project",
        resourceId: betaProject.id,
        role: "viewer",
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: regularUser.id,
        resourceType: "example",
        resourceId: exampleTwo.id,
        role: "viewer",
        createdAt: new Date(),
      },
    )
    log(`✅ user@example.com → viewer on Beta Project, Example Two`)
  }

  if (grants.length) {
    await db.insert(resourceRoles).values(grants).onConflictDoNothing()
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────────")
  console.log("✅ Seed complete!\n")
  console.log("Test credentials:")
  console.log("  superadmin@example.com / Password123!  (super_admin)")
  console.log("  admin@example.com      / Password123!  (admin)")
  console.log("  editor@example.com     / Password123!  (editor)")
  console.log("  user@example.com       / Password123!  (user)\n")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seed failed:", err)
    process.exit(1)
  })
