import { useState } from "react"

import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { ManagedUser } from "@/features/users/api/users.api"
import { useUpdateUserRole } from "@/features/users/api/users.hooks"

const ASSIGNABLE_ROLES = [
  { value: "user", label: "User" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
]

interface EditRoleDialogProps {
  user: ManagedUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRoleDialog({ user, open, onOpenChange }: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState(user.role ?? "user")
  const { mutateAsync, isPending } = useUpdateUserRole()

  async function handleSave() {
    try {
      await mutateAsync({ userId: user.id, role: selectedRole })
      toast.success(`Role updated to "${selectedRole}" for ${user.name}`)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update role")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border/60 bg-card shadow-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">Change Role</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Updating role for <span className="font-medium text-foreground">{user.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            New Role
          </Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || selectedRole === (user.role ?? "user")}
            className="gap-2"
          >
            {isPending && <IconLoader2 size={14} className="animate-spin" />}
            {isPending ? "Saving…" : "Save Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
