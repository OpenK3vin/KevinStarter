import { atom } from "jotai"

export type Step = "login" | "verify-2fa" | "setup-scan" | "setup-backup"

export const stepAtom = atom<Step>("login")
export const useBackupCodeAtom = atom<boolean>(false)
export const totpURIAtom = atom<string | null>(null)
export const backupCodesAtom = atom<string[]>([])
