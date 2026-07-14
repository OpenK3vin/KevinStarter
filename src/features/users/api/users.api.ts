import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Auth guard — only super_admin may manage users
// ---------------------------------------------------------------------------

async function requireSuperAdmin() {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || role !== 'super_admin') {
    throw new Error('Forbidden: super_admin access required')
  }
  return session
}

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
 * List all users (super_admin only).
 */
export const listUsers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ManagedUser[]> => {
    await requireSuperAdmin()
    const headers = getRequestHeaders()

    const result = await auth.api.listUsers({
      headers,
      query: { limit: 200 },
    })

    // Filter out the requesting user from destructive actions in the UI,
    // but still include them in the list.
    const users = (result as any).users ?? []
    return users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role ?? 'user',
      banned: u.banned ?? false,
      banReason: u.banReason ?? null,
      createdAt: u.createdAt instanceof Date
        ? u.createdAt.toISOString()
        : String(u.createdAt),
      image: u.image ?? null,
    }))
  },
)

/**
 * Create a new user with an initial role (super_admin only).
 */
export const createUser = createServerFn({ method: 'POST' })
  .validator((input: CreateUserInput) => input)
  .handler(async ({ data }): Promise<ManagedUser> => {
    await requireSuperAdmin()
    const headers = getRequestHeaders()

    const validRoles = ['user', 'admin', 'editor'] as const
    type ValidRole = typeof validRoles[number]
    const safeRole = (validRoles as readonly string[]).includes(data.role)
      ? (data.role as ValidRole)
      : 'user'

    const result = await auth.api.createUser({
      headers,
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
      createdAt: u.createdAt instanceof Date
        ? u.createdAt.toISOString()
        : String(u.createdAt),
      image: u.image ?? null,
    }
  })

/**
 * Update a user's role (super_admin only).
 */
export const updateUserRole = createServerFn({ method: 'POST' })
  .validator((input: UpdateRoleInput) => input)
  .handler(async ({ data }): Promise<void> => {
    await requireSuperAdmin()
    const headers = getRequestHeaders()

    const validRoles = ['user', 'admin', 'editor'] as const
    type ValidRole = typeof validRoles[number]
    const safeRole = (validRoles as readonly string[]).includes(data.role)
      ? (data.role as ValidRole)
      : 'user'

    await auth.api.setRole({
      headers,
      body: { userId: data.userId, role: safeRole },
    })
  })

/**
 * Ban a user (super_admin only).
 */
export const banUser = createServerFn({ method: 'POST' })
  .validator((input: BanInput) => input)
  .handler(async ({ data }): Promise<void> => {
    await requireSuperAdmin()
    const headers = getRequestHeaders()

    await auth.api.banUser({
      headers,
      body: { userId: data.userId, banReason: data.reason },
    })
  })

/**
 * Unban a user (super_admin only).
 */
export const unbanUser = createServerFn({ method: 'POST' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<void> => {
    await requireSuperAdmin()
    const headers = getRequestHeaders()

    await auth.api.unbanUser({ headers, body: { userId } })
  })

/**
 * Delete a user permanently (super_admin only).
 */
export const removeUser = createServerFn({ method: 'POST' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<void> => {
    await requireSuperAdmin()
    const headers = getRequestHeaders()

    await auth.api.removeUser({ headers, body: { userId } })
  })
