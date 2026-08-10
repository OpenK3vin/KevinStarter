import { Link } from "@tanstack/react-router"
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

export function TwoFactorCard() {
  const { data: session } = authClient.useSession()
  
  // better-auth types are tricky with plugins on the client
  const is2FAEnabled = session?.user?.twoFactorEnabled ?? false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security to your account using a TOTP authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {is2FAEnabled ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">2FA is enabled</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-muted-foreground">2FA is not enabled</span>
              </>
            )}
          </div>
          
          <Button asChild variant={is2FAEnabled ? "outline" : "default"}>
            <Link to={is2FAEnabled ? "/two-factor/manage" : "/two-factor/setup"}>
              {is2FAEnabled ? "Manage" : "Set up"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
