import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import {
  useUsers,
  useBanUser,
  useUnbanUser,
  useRemoveUser,
} from '@/features/users/api/users.hooks'
import type { ManagedUser } from '@/features/users/api/users.api'
import { InviteUserDialog } from './InviteUserDialog'
import { EditRoleDialog } from './EditRoleDialog'
import { AssignResourceDialog } from './AssignResourceDialog'
import {
  IconUsers,
  IconShieldCheck,
  IconUserOff,
  IconUserCheck,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconBan,
  IconTrash,
  IconRefresh,
  IconLoader2,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconFolder,
  IconExternalLink,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ---------------------------------------------------------------------------
// Role badge styling
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: 'Super Admin',
    className:
      'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  },
  admin: {
    label: 'Admin',
    className:
      'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400',
  },
  editor: {
    label: 'Editor',
    className:
      'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  },
  user: {
    label: 'User',
    className:
      'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400',
  },
}

function RoleBadge({ role }: { role: string | null }) {
  const cfg = ROLE_CONFIG[role ?? 'user'] ?? ROLE_CONFIG.user
  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-semibold tracking-wide px-2 py-0.5 ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  )
}

function StatusChip({ banned }: { banned: boolean | null }) {
  if (banned) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
        <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
        Banned
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortKey = 'name' | 'email' | 'role' | 'createdAt' | 'banned'
type SortDir = 'asc' | 'desc' | null

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc') return <IconChevronUp size={12} className="ml-1 opacity-70" />
  if (dir === 'desc') return <IconChevronDown size={12} className="ml-1 opacity-70" />
  return <IconSelector size={12} className="ml-1 opacity-40" />
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-sm
        before:absolute before:inset-0 before:opacity-5 ${accent}`}
    >
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        <div className={`rounded-lg p-2 ${accent} bg-opacity-10`}>{icon}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UserManagementDashboard() {
  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id

  const { data: users = [], isLoading, isError, refetch, isFetching } = useUsers()
  const { mutateAsync: doBan, isPending: banning } = useBanUser()
  const { mutateAsync: doUnban, isPending: unbanning } = useUnbanUser()
  const { mutateAsync: doRemove, isPending: removing } = useRemoveUser()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Dialogs
  const [editRoleUser, setEditRoleUser] = useState<ManagedUser | null>(null)
  const [assignResourceUser, setAssignResourceUser] = useState<ManagedUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [banTarget, setBanTarget] = useState<ManagedUser | null>(null)

  // ---------------------------------------------------------------------------
  // Sort click
  // ---------------------------------------------------------------------------
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => !u.banned).length
    const banned = users.filter((u) => u.banned).length
    const admins = users.filter(
      (u) => u.role === 'admin' || u.role === 'super_admin',
    ).length
    return { total, active, banned, admins }
  }, [users])

  // ---------------------------------------------------------------------------
  // Filtered + sorted list
  // ---------------------------------------------------------------------------
  const displayed = useMemo(() => {
    let list = [...users]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }

    if (roleFilter !== 'all') {
      list = list.filter((u) => (u.role ?? 'user') === roleFilter)
    }

    if (statusFilter === 'active') list = list.filter((u) => !u.banned)
    if (statusFilter === 'banned') list = list.filter((u) => u.banned)

    if (sortDir) {
      list.sort((a, b) => {
        let av: string = ''
        let bv: string = ''
        if (sortKey === 'name') { av = a.name; bv = b.name }
        else if (sortKey === 'email') { av = a.email; bv = b.email }
        else if (sortKey === 'role') { av = a.role ?? 'user'; bv = b.role ?? 'user' }
        else if (sortKey === 'createdAt') { av = a.createdAt; bv = b.createdAt }
        else if (sortKey === 'banned') {
          av = a.banned ? '1' : '0'
          bv = b.banned ? '1' : '0'
        }
        const cmp = av.localeCompare(bv)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return list
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  async function handleBan(user: ManagedUser) {
    try {
      await doBan({ userId: user.id })
      toast.success(`${user.name} has been banned`)
      setBanTarget(null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to ban user')
    }
  }

  async function handleUnban(user: ManagedUser) {
    try {
      await doUnban(user.id)
      toast.success(`${user.name} has been unbanned`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to unban user')
    }
  }

  async function handleDelete(user: ManagedUser) {
    try {
      await doRemove(user.id)
      toast.success(`${user.name} deleted`)
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete user')
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Invite, configure roles, and manage access for all platform users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="size-9"
            title="Refresh"
          >
            <IconRefresh size={15} className={isFetching ? 'animate-spin' : ''} />
          </Button>
          <InviteUserDialog />
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<IconUsers size={18} className="text-violet-500" />}
          label="Total Users"
          value={stats.total}
          accent="before:bg-violet-500"
        />
        <StatCard
          icon={<IconUserCheck size={18} className="text-emerald-500" />}
          label="Active"
          value={stats.active}
          accent="before:bg-emerald-500"
        />
        <StatCard
          icon={<IconUserOff size={18} className="text-red-500" />}
          label="Banned"
          value={stats.banned}
          accent="before:bg-red-500"
        />
        <StatCard
          icon={<IconShieldCheck size={18} className="text-amber-500" />}
          label="Admins"
          value={stats.admins}
          accent="before:bg-amber-500"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="user-search"
            placeholder="Search name or email…"
            className="h-9 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger id="role-filter" className="h-9 w-36 text-sm">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" className="h-9 w-32 text-sm">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
            <IconLoader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : isError ? (
          <div className="py-24 text-center text-sm text-destructive">
            Failed to load users.{' '}
            <button
              onClick={() => refetch()}
              className="underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  {(
                    [
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      { key: 'role', label: 'Role' },
                      { key: 'banned', label: 'Status' },
                      { key: 'createdAt', label: 'Joined' },
                    ] as { key: SortKey; label: string }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left font-medium text-xs uppercase tracking-widest text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon
                          dir={sortKey === col.key ? sortDir : null}
                        />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-widest text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  displayed.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border/40 transition-colors hover:bg-muted/30 ${
                        idx % 2 === 0 ? '' : 'bg-muted/10'
                      } ${user.id === currentUserId ? 'ring-1 ring-inset ring-amber-500/20' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">
                            {user.name}
                            {user.id === currentUserId && (
                              <span className="ml-2 text-[10px] text-amber-500 font-semibold">(you)</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusChip banned={user.banned} />
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 opacity-60 hover:opacity-100"
                              disabled={user.id === currentUserId}
                              title={user.id === currentUserId ? 'Cannot modify yourself' : 'Actions'}
                            >
                              <IconDotsVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                              <Link to="/admin/users/$userId" params={{ userId: user.id }}>
                                <IconExternalLink size={14} />
                                Manage User
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onSelect={() => setEditRoleUser(user)}
                            >
                              <IconEdit size={14} />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onSelect={() => setAssignResourceUser(user)}
                            >
                              <IconFolder size={14} />
                              Assign Resources
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.banned ? (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                                onSelect={() => handleUnban(user)}
                                disabled={unbanning}
                              >
                                <IconUserCheck size={14} />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
                                onSelect={() => setBanTarget(user)}
                              >
                                <IconBan size={14} />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              onSelect={() => setDeleteTarget(user)}
                            >
                              <IconTrash size={14} />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Footer */}
            {displayed.length > 0 && (
              <div className="border-t border-border/40 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                Showing {displayed.length} of {users.length} users
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Role Dialog ── */}
      {editRoleUser && (
        <EditRoleDialog
          user={editRoleUser}
          open={!!editRoleUser}
          onOpenChange={(open) => { if (!open) setEditRoleUser(null) }}
        />
      )}

      {/* ── Assign Resource Dialog ── */}
      {assignResourceUser && (
        <AssignResourceDialog
          user={assignResourceUser}
          open={!!assignResourceUser}
          onOpenChange={(open) => { if (!open) setAssignResourceUser(null) }}
        />
      )}

      {/* ── Ban Confirm ── */}
      <AlertDialog
        open={!!banTarget}
        onOpenChange={(open) => { if (!open) setBanTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {banTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will be prevented from signing in. You can unban them at
              any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
              onClick={() => banTarget && handleBan(banTarget)}
              disabled={banning}
            >
              {banning && <IconLoader2 size={14} className="animate-spin" />}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is <strong>irreversible</strong>. All data associated
              with this user will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={removing}
            >
              {removing && <IconLoader2 size={14} className="animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
