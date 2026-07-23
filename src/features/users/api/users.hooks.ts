import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { BanInput, CreateUserInput, ManagedUser, UpdateRoleInput } from "./users.api"
import {
  assignResourceRole,
  banUser,
  createUser,
  getUserById,
  getUserResources,
  listUsers,
  removeUser,
  revokeResourceRole,
  unbanUser,
  updateUserRole,
} from "./users.api"

const QUERY_KEY = ["users"] as const

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId] as const,
    queryFn: () => getUserById({ data: userId }),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listUsers(),
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser({ data: input }),
    onSuccess: (newUser) => {
      queryClient.setQueryData<ManagedUser[]>(QUERY_KEY, (prev = []) => [newUser, ...prev])
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateRoleInput) => updateUserRole({ data: input }),
    onSuccess: (_data, input) => {
      queryClient.setQueryData<ManagedUser[]>(QUERY_KEY, (prev = []) =>
        prev.map((u) => (u.id === input.userId ? { ...u, role: input.role } : u)),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useBanUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BanInput) => banUser({ data: input }),
    onSuccess: (_data, input) => {
      queryClient.setQueryData<ManagedUser[]>(QUERY_KEY, (prev = []) =>
        prev.map((u) =>
          u.id === input.userId ? { ...u, banned: true, banReason: input.reason ?? null } : u,
        ),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUnbanUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => unbanUser({ data: userId }),
    onSuccess: (_data, userId) => {
      queryClient.setQueryData<ManagedUser[]>(QUERY_KEY, (prev = []) =>
        prev.map((u) => (u.id === userId ? { ...u, banned: false, banReason: null } : u)),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useRemoveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeUser({ data: userId }),
    onSuccess: (_data, userId) => {
      queryClient.setQueryData<ManagedUser[]>(QUERY_KEY, (prev = []) =>
        prev.filter((u) => u.id !== userId),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

// ---------------------------------------------------------------------------
// Resource Roles
// ---------------------------------------------------------------------------

export const resourceKeys = {
  all: ["user-resources"] as const,
  byUser: (userId: string) => [...resourceKeys.all, userId] as const,
}

export function useUserResources(userId: string) {
  return useQuery({
    queryKey: resourceKeys.byUser(userId),
    queryFn: () => getUserResources({ data: userId }),
    enabled: !!userId,
  })
}

export function useAssignResourceRole(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      resourceType: "project"
      resourceId: string
      role: "editor" | "viewer"
    }) => assignResourceRole({ data: { userId, ...input } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.byUser(userId) })
    },
  })
}

export function useRevokeResourceRole(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) => revokeResourceRole({ data: assignmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.byUser(userId) })
    },
  })
}
