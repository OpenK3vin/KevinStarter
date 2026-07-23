import { useState } from "react"

import { IconLoader2, IconUserPlus } from "@tabler/icons-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { CreateUserInput } from "@/features/users/api/users.api"
import { useCreateUser } from "@/features/users/api/users.hooks"

const ASSIGNABLE_ROLES = [
  { value: "user", label: "User" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
]

interface FormValues {
  name: string
  email: string
  password: string
  role: string
}

export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const { mutateAsync, isPending } = useCreateUser()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", email: "", password: "", role: "user" },
  })

  const selectedRole = watch("role")

  async function onSubmit(values: FormValues) {
    try {
      await mutateAsync(values as CreateUserInput)
      toast.success(`User ${values.email} created successfully`)
      reset()
      setOpen(false)
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create user")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-amber-500 font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-600">
          <IconUserPlus size={16} />
          Invite User
        </Button>
      </DialogTrigger>

      <DialogContent className="border border-border/60 bg-card shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Invite New User
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create an account with an initial role. The user can change their password after first
            login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="invite-name"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              Full Name
            </Label>
            <Input
              id="invite-name"
              placeholder="John Doe"
              {...register("name", { required: "Name is required" })}
              className="h-9"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="invite-email"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              Email
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
              className="h-9 font-mono text-sm"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="invite-password"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              Temporary Password
            </Label>
            <Input
              id="invite-password"
              type="password"
              placeholder="Min. 8 characters"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" },
              })}
              className="h-9"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="grid gap-1.5">
            <Label
              htmlFor="invite-role"
              className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
            >
              Role
            </Label>
            <Select value={selectedRole} onValueChange={(v) => setValue("role", v)}>
              <SelectTrigger id="invite-role" className="h-9">
                <SelectValue placeholder="Select a role" />
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

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
            >
              {isPending && <IconLoader2 size={14} className="animate-spin" />}
              {isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
