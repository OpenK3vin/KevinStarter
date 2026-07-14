import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ManagedUser } from '../api/users.api'
import {
  useUserResources,
  useAssignResourceRole,
  useRevokeResourceRole,
} from '../api/users.hooks'
import { getProjects } from '@/features/projects/server/projectApi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconTrash, IconLoader2 } from '@tabler/icons-react'

// ---------------------------------------------------------------------------
// Inline role editor for existing assignments
// ---------------------------------------------------------------------------

function InlineRoleSelect({
  assignmentId: _assignmentId,
  userId,
  resourceType,
  resourceId,
  currentRole,
}: {
  assignmentId: string
  userId: string
  resourceType: string
  resourceId: string
  currentRole: string
}) {
  const [saving, setSaving] = useState(false)
  const { mutateAsync: assign } = useAssignResourceRole(userId)

  async function handleChange(newRole: 'editor' | 'viewer') {
    if (newRole === currentRole) return
    setSaving(true)
    try {
      // assignResourceRole upserts — if the row already exists it updates the role
      await assign({ resourceType: resourceType as 'project', resourceId, role: newRole })
      toast.success('Role updated')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  if (resourceType !== 'project') {
    // Non-project resources: show read-only label since we only support 'project' in UI
    return <span className="text-sm capitalize text-muted-foreground">{currentRole}</span>
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        value={currentRole}
        onValueChange={(v) => handleChange(v as 'editor' | 'viewer')}
        disabled={saving}
      >
        <SelectTrigger className="h-7 w-[90px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      {saving && <IconLoader2 size={12} className="animate-spin text-muted-foreground" />}
    </div>
  )
}

export function AssignResourceDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ManagedUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer')

  const { data: assignments = [], isLoading: loadingAssignments } = useUserResources(user.id)
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    enabled: open,
  })

  const { mutateAsync: assign, isPending: assigning } = useAssignResourceRole(user.id)
  const { mutateAsync: revoke } = useRevokeResourceRole(user.id)

  const [revoking, setRevoking] = useState<string | null>(null)

  async function handleAssign() {
    if (!selectedProjectId) {
      toast.error('Please select a project')
      return
    }
    try {
      await assign({
        resourceType: 'project',
        resourceId: selectedProjectId,
        role: selectedRole,
      })
      toast.success('Resource assigned successfully')
      setSelectedProjectId('')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to assign resource')
    }
  }

  async function handleRevoke(assignmentId: string) {
    setRevoking(assignmentId)
    try {
      await revoke(assignmentId)
      toast.success('Access revoked')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to revoke access')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Resources</DialogTitle>
          <DialogDescription>
            Grant {user.name} access to specific projects.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Assignment Form */}
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-1">New Assignment</h4>
            <div className="flex gap-2">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingProjects ? (
                    <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                      <IconLoader2 size={14} className="animate-spin mr-2" /> Loading...
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No projects found</div>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={(val: 'editor' | 'viewer') => setSelectedRole(val)}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="mt-2 w-full bg-sea-ink hover:opacity-90"
              onClick={handleAssign}
              disabled={assigning || !selectedProjectId}
            >
              {assigning && <IconLoader2 size={14} className="animate-spin mr-2" />}
              Assign Access
            </Button>
          </div>

          {/* Existing Assignments */}
          <div>
            <h4 className="text-sm font-medium mb-2">Current Access</h4>
            <div className="border border-border/50 rounded-lg overflow-hidden">
              {loadingAssignments ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <IconLoader2 size={16} className="animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : assignments.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground bg-muted/10">
                  This user has no specific resource assignments.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/50">
                      <th className="text-left font-medium p-2 text-muted-foreground">Resource</th>
                      <th className="text-left font-medium p-2 text-muted-foreground">Role</th>
                      <th className="text-right p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                        <td className="p-2 truncate max-w-[150px]" title={a.projectName || a.resourceId}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {a.resourceType}
                            </span>
                            <span>
                              {a.projectName || <span className="font-mono text-xs opacity-60">{a.resourceId.slice(0, 8)}...</span>}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <InlineRoleSelect
                            assignmentId={a.id}
                            resourceType={a.resourceType}
                            resourceId={a.resourceId}
                            currentRole={a.role}
                            userId={user.id}
                          />
                        </td>
                        <td className="p-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevoke(a.id)}
                            disabled={revoking === a.id}
                            title="Revoke Access"
                          >
                            {revoking === a.id ? (
                              <IconLoader2 size={14} className="animate-spin" />
                            ) : (
                              <IconTrash size={14} />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
