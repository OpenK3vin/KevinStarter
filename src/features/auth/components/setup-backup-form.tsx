import { useRouter } from "@tanstack/react-router"
import { useAtomValue } from "jotai"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { backupCodesAtom } from "../state/auth.atoms"

export function SetupBackupForm() {
  const router = useRouter()
  const backupCodes = useAtomValue(backupCodesAtom)

  function handleSetupFinish() {
    router.invalidate()
    router.navigate({ to: "/" })
  }

  return (
    <div className="rise-in space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">Secure Your Account</h1>
        <p className="text-sm text-muted-foreground">Save your backup codes</p>
      </div>
      <Card className="island-shell border-none">
        <CardHeader>
          <CardTitle>Save Backup Codes</CardTitle>
          <CardDescription>
            If you lose access to your authenticator app, you can use these backup codes to sign
            in. Save them in a secure place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
            {backupCodes.map((code, idx) => (
              <div key={idx}>{code}</div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetupFinish} className="w-full">
            I have saved my backup codes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
