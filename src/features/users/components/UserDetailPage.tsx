import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  useUser,
  useUpdateUserRole,
  useBanUser,
  useUnbanUser,
  useUserResources,
  useAssignResourceRole,
  useRevokeResourceRole,
} from '@/features/users/api/users.hooks'
import { getProjects } from '@/features/projects/server/projectApi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  IconArrowLeft,
  IconLoader2,
  IconTrash,
  IconBan,
  IconUserCheck,
  IconShieldCheck,
  IconFolder,
  IconPlus,
} from '@tabler/icons-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: 'Super Admin',
    className: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  },
  admin: {
    label: 'Admin',
    className: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400',
  },
  editor: {
    label: 'Editor',
    className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  },
  user: {
    label: 'User',
    className: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400',
  },
}

const GLOBAL_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

// ---------------------------------------------------------------------------
// Section shell
// ---------------------------------------------------------------------------

function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Global Role Panel
// ---------------------------------------------------------------------------

function GlobalRolePanel({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const { mutateAsync: updateRole, isPending } = useUpdateUserRole()

  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user

  async function handleSave() {
    try {
      await updateRole({ userId, role })
      toast.success('Global role updated')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update role')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">Global Platform Role</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Applies across the whole platform. Resource-level access is configured separately below.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={`text-[11px] font-semibold px-2 py-0.5 ${cfg.className}`}>
          {cfg.label}
        </Badge>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GLOBAL_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={handleSave}
          disabled={isPending || role === currentRole}
        >
          {isPending ? <IconLoader2 size={12} className="animate-spin mr-1" /> : null}
          Save
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Resource Assignments Panel
// ---------------------------------------------------------------------------

function ResourceAssignmentsPanel({ userId }: { userId: string }) {
  const { data: assignments = [], isLoading } = useUserResources(userId)
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  })
  const { mutateAsync: assign, isPending: assigning } = useAssignResourceRole(userId)
  const { mutateAsync: revoke } = useRevokeResourceRole(userId)

  const [newProjectId, setNewProjectId] = useState('')
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('viewer')
  const [revoking, setRevoking] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  async function handleAssign() {
    if (!newProjectId) { toast.error('Select a project'); return }
    try {
      await assign({ resourceType: 'project', resourceId: newProjectId, role: newRole })
      toast.success('Access granted')
      setNewProjectId('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to assign')
    }
  }

  async function handleRoleChange(resourceId: string, resourceType: string, nextRole: 'editor' | 'viewer') {
    setSaving(resourceId)
    try {
      await assign({ resourceType: resourceType as 'project', resourceId, role: nextRole })
      toast.success('Role updated')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update role')
    } finally {
      setSaving(null)
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id)
    try {
      await revoke(id)
      toast.success('Access revoked')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to revoke')
    } finally {
      setRevoking(null)
    }
  }

  const projectAssignments = assignments.filter(a => a.resourceType === 'project')
  const otherAssignments = assignments.filter(a => a.resourceType !== 'project')

  return (
    <div className="flex flex-col gap-6">
      {/* Add new */}
      <div className="flex flex-wrap items-end gap-2 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex flex-col gap-1 flex-1 min-w-40">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</label>
          <Select value={newProjectId} onValueChange={setNewProjectId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select project…" />
            </SelectTrigger>
            <SelectContent>
              {loadingProjects
                ? <SelectItem value="" disabled>Loading…</SelectItem>
                : projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</label>
          <Select value={newRole} onValueChange={(v: 'editor' | 'viewer') => setNewRole(v)}>
            <SelectTrigger className="h-8 w-28 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={handleAssign} disabled={assigning || !newProjectId}>
          {assigning ? <IconLoader2 size={13} className="animate-spin" /> : <IconPlus size={13} />}
          Grant Access
        </Button>
      </div>

      {/* Existing assignments */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <IconLoader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : assignments.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg">
          No resource assignments yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border/50">
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Type</th>
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Resource</th>
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Role</th>
                <th className="text-left font-medium text-xs uppercase tracking-wider text-muted-foreground px-4 py-2.5">Granted</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {[...projectAssignments, ...otherAssignments].map((a) => (
                <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <IconFolder size={12} />
                      {a.resourceType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {a.projectName ?? (
                      <span className="font-mono text-xs text-muted-foreground">{a.resourceId.slice(0, 12)}…</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.resourceType === 'project' ? (
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={a.role}
                          onValueChange={(v) => handleRoleChange(a.resourceId, a.resourceType, v as 'editor' | 'viewer')}
                          disabled={saving === a.resourceId}
                        >
                          <SelectTrigger className="h-7 w-[100px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        {saving === a.resourceId && <IconLoader2 size={12} className="animate-spin text-muted-foreground" />}
                      </div>
                    ) : (
                      <span className="capitalize text-muted-foreground">{a.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    —
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevoke(a.id)}
                      disabled={revoking === a.id}
                      title="Revoke access"
                    >
                      {revoking === a.id
                        ? <IconLoader2 size={13} className="animate-spin" />
                        : <IconTrash size={13} />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger Zone
// ---------------------------------------------------------------------------

function DangerZone({ userId, userName, isBanned }: {
  userId: string
  userName: string
  isBanned: boolean | null
}) {
  const [confirmBan, setConfirmBan] = useState(false)
  const { mutateAsync: doBan, isPending: banning } = useBanUser()
  const { mutateAsync: doUnban, isPending: unbanning } = useUnbanUser()

  async function handleBan() {
    try {
      await doBan({ userId })
      toast.success(`${userName} has been banned`)
      setConfirmBan(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to ban user')
    }
  }

  async function handleUnban() {
    try {
      await doUnban(userId)
      toast.success(`${userName} has been unbanned`)
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to unban user')
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-destructive">
            {isBanned ? 'Unban User' : 'Ban User'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBanned
              ? 'Restore access so this user can sign in again.'
              : 'Prevent this user from signing in. Reversible at any time.'}
          </p>
        </div>
        {isBanned ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
            onClick={handleUnban}
            disabled={unbanning}
          >
            {unbanning ? <IconLoader2 size={13} className="animate-spin" /> : <IconUserCheck size={13} />}
            Unban User
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmBan(true)}
          >
            <IconBan size={13} />
            Ban User
          </Button>
        )}
      </div>

      <AlertDialog open={confirmBan} onOpenChange={setConfirmBan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {userName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will be prevented from signing in. You can unban them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
              onClick={handleBan}
              disabled={banning}
            >
              {banning && <IconLoader2 size={14} className="animate-spin" />}
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function UserDetailPage({ userId }: { userId: string }) {
  const { data: user, isLoading, isError } = useUser(userId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2 text-muted-foreground">
        <IconLoader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading user…</span>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <p className="text-sm">User not found or you do not have permission.</p>
        <Link to="/admin/users" className="text-sm underline underline-offset-2 hover:opacity-70">
          ← Back to User Management
        </Link>
      </div>
    )
  }

  const cfg = ROLE_CONFIG[user.role ?? 'user'] ?? ROLE_CONFIG.user

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">

      {/* ── Back link ── */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <IconArrowLeft size={14} />
        Back to User Management
      </Link>

      {/* ── User header card ── */}
      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="size-14 rounded-full bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight truncate">{user.name}</h1>
            <Badge variant="outline" className={`text-[11px] font-semibold px-2 py-0.5 ${cfg.className}`}>
              {cfg.label}
            </Badge>
            {user.banned && (
              <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5 bg-red-500/10 text-red-500 border-red-500/30">
                Banned
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <IconShieldCheck size={22} className="text-muted-foreground/40 shrink-0" />
      </div>

      {/* ── Global Role ── */}
      <Section
        title="Global Role"
        description="The user's platform-wide permissions tier."
      >
        <GlobalRolePanel userId={user.id} currentRole={user.role ?? 'user'} />
      </Section>

      {/* ── Resource Permissions ── */}
      <Section
        title="Resource Permissions"
        description="Grant or revoke access to specific projects. Resource roles take precedence for fine-grained control."
      >
        <ResourceAssignmentsPanel userId={user.id} />
      </Section>

      {/* ── Danger Zone ── */}
      <Section title="Danger Zone">
        <DangerZone userId={user.id} userName={user.name} isBanned={user.banned} />
      </Section>
    </div>
  )
}
