/**
 * Seed script — populates the database with example data for local testing.
 *
 * Run: pnpm db:seed
 *
 * Users created
 * ─────────────────────────────────────────────────────────────────────────
 *  email                 password       role
 *  admin@example.com     Password123!   admin   (global admin, bypasses RBAC)
 *  editor@example.com    Password123!   editor  (can create projects)
 *  user@example.com      Password123!   user    (regular user, viewer access)
 *
 * Resource grants
 * ─────────────────────────────────────────────────────────────────────────
 *  editor  → editor  on Alpha Project + Gamma Project
 *  editor  → editor  on Example One
 *  user    → viewer  on Beta Project
 *  user    → viewer  on Example Two
 */

import { auth } from '../lib/auth'
import { db } from './index'
import { examples, projects, resourceRoles, user } from './schema'
import { eq } from 'drizzle-orm'

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_USERS = [
  {
    email: 'admin@example.com',
    password: 'Password123!',
    name: 'Alice Admin',
    role: 'admin' as const,
  },
  {
    email: 'editor@example.com',
    password: 'Password123!',
    name: 'Eve Editor',
    role: 'editor' as const,
  },
  {
    email: 'user@example.com',
    password: 'Password123!',
    name: 'Bob User',
    role: 'user' as const,
  },
]

const SEED_EXAMPLES = [
  { name: 'Example One', description: 'First example row — used to demonstrate RBAC read access.' },
  { name: 'Example Two', description: 'Second example row — assigned as viewer to the regular user.' },
  { name: 'Example Three', description: 'Third example row — no specific grant; admin-only access.' },
]

const SEED_PROJECTS = [
  { name: 'Alpha Project', description: 'Infrastructure upgrade — editor Eve has editor access.' },
  { name: 'Beta Project', description: 'Customer portal v2 — regular user Bob has viewer access.' },
  { name: 'Gamma Project', description: 'Data pipeline migration — editor Eve has editor access.' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`)
}

async function createUser(u: (typeof SEED_USERS)[number]) {
  try {
    await auth.api.signUpEmail({
      body: { email: u.email, password: u.password, name: u.name },
    })
    log(`✅ Created user: ${u.email}`)
  } catch {
    log(`⚠️  User already exists, skipping: ${u.email}`)
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding database...\n')

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log('👤 Creating users...')
  for (const u of SEED_USERS) {
    await createUser(u)
  }

  // Update roles directly — better-auth defaults everyone to 'user'
  for (const u of SEED_USERS) {
    if (u.role !== 'user') {
      await db
        .update(user)
        .set({ role: u.role })
        .where(eq(user.email, u.email))
      log(`🔑 Set role '${u.role}' for ${u.email}`)
    }
  }

  // Fetch users to get their IDs for resource role grants
  const allUsers = await db.query.user.findMany()
  const editorUser = allUsers.find((u) => u.email === 'editor@example.com')
  const regularUser = allUsers.find((u) => u.email === 'user@example.com')

  // ── 2. Examples ───────────────────────────────────────────────────────────
  console.log('\n📄 Creating examples...')
  const exampleRows = SEED_EXAMPLES.map((e) => ({
    id: crypto.randomUUID(),
    name: e.name,
    description: e.description,
    createdAt: new Date(),
  }))

  await db.insert(examples).values(exampleRows).onConflictDoNothing()
  exampleRows.forEach((e) => log(`✅ ${e.name}`))

  // ── 3. Projects ───────────────────────────────────────────────────────────
  console.log('\n📁 Creating projects...')
  const projectRows = SEED_PROJECTS.map((p) => ({
    id: crypto.randomUUID(),
    name: p.name,
    description: p.description,
    createdAt: new Date(),
  }))

  await db.insert(projects).values(projectRows).onConflictDoNothing()
  projectRows.forEach((p) => log(`✅ ${p.name}`))

  const [alphaProject, betaProject, gammaProject] = projectRows
  const [exampleOne, exampleTwo] = exampleRows

  // ── 4. Resource role grants ───────────────────────────────────────────────
  console.log('\n🔐 Granting resource roles...')
  const grants = []

  if (editorUser) {
    grants.push(
      {
        id: crypto.randomUUID(),
        userId: editorUser.id,
        resourceType: 'project',
        resourceId: alphaProject.id,
        role: 'editor',
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: editorUser.id,
        resourceType: 'project',
        resourceId: gammaProject.id,
        role: 'editor',
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: editorUser.id,
        resourceType: 'example',
        resourceId: exampleOne.id,
        role: 'editor',
        createdAt: new Date(),
      },
    )
    log(`✅ editor@example.com → editor on Alpha Project, Gamma Project, Example One`)
  }

  if (regularUser) {
    grants.push(
      {
        id: crypto.randomUUID(),
        userId: regularUser.id,
        resourceType: 'project',
        resourceId: betaProject.id,
        role: 'viewer',
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        userId: regularUser.id,
        resourceType: 'example',
        resourceId: exampleTwo.id,
        role: 'viewer',
        createdAt: new Date(),
      },
    )
    log(`✅ user@example.com → viewer on Beta Project, Example Two`)
  }

  if (grants.length) {
    await db.insert(resourceRoles).values(grants).onConflictDoNothing()
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────')
  console.log('✅ Seed complete!\n')
  console.log('Test credentials:')
  console.log('  admin@example.com   / Password123!  (admin)')
  console.log('  editor@example.com  / Password123!  (editor)')
  console.log('  user@example.com    / Password123!  (user)\n')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  })
