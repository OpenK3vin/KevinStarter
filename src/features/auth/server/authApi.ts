import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { auth } from "@/lib/auth"

export const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({
    headers,
  })
  return session
})

export const listUserAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()
  const accounts = await auth.api.listUserAccounts({
    headers,
  })
  return accounts
})

export const listSessions = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()
  const sessions = await auth.api.listSessions({
    headers,
  })
  return sessions
})
