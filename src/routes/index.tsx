import { Link, createFileRoute } from "@tanstack/react-router"

import { IconCode, IconFolder, IconLogin, IconShieldLock } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  const { data: session, isPending } = authClient.useSession()

  return (
    <div className="rise-in mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 md:px-8">
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="display-title text-5xl font-bold tracking-tight">
          Welcome to KevinPulse Starter
        </h1>

        {!isPending && session ? (
          <p className="text-xl text-muted-foreground">
            You are currently logged in as{" "}
            <span className="font-semibold text-foreground">{session.user.email}</span>.
          </p>
        ) : !isPending ? (
          <p className="max-w-2xl text-xl text-muted-foreground">
            A production-ready TanStack Start template with RBAC, Drizzle ORM, and modern UI
            components.
          </p>
        ) : (
          <p className="max-w-2xl text-xl text-muted-foreground">Loading...</p>
        )}

        {!session && !isPending && (
          <div className="mt-4">
            <Button size="lg" asChild>
              <Link to="/login" className="gap-2">
                <IconLogin className="h-5 w-5" />
                Sign In to Test Authentication
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Auth Testing Card */}
        <Card className="island-shell flex flex-col border-none">
          <CardHeader>
            <IconShieldLock className="text-sea-ink mb-4 h-8 w-8" />
            <CardTitle>Authentication & Roles</CardTitle>
            <CardDescription>Test out global role-based access control (RBAC).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              {session ? (
                <>
                  Your global role is currently set to{" "}
                  <strong className="text-foreground capitalize">
                    {session.user.role || "User"}
                  </strong>
                  .
                </>
              ) : (
                'Users can have different global roles (like "user", "editor", or "admin").'
              )}{" "}
              Certain actions require specific roles.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to={session ? "/projects" : "/login"}>
                {session ? "View Projects" : "Sign In to Test"}
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Explore Projects Card */}
        <Card className="island-shell flex flex-col border-none">
          <CardHeader>
            <IconFolder className="text-sea-ink mb-4 h-8 w-8" />
            <CardTitle>Resource Authorization</CardTitle>
            <CardDescription>Granular permissions per resource.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Head over to the Projects section. You can only view or edit projects that you have
              been explicitly granted access to, demonstrating row-level security and granular
              resource roles.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild disabled={!session}>
              <Link to={session ? "/projects" : "/login"}>
                {session ? "Manage Projects" : "Login Required"}
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Under the Hood Card */}
        <Card className="island-shell flex flex-col border-none">
          <CardHeader>
            <IconCode className="text-sea-ink mb-4 h-8 w-8" />
            <CardTitle>Built with the best</CardTitle>
            <CardDescription>Modern React stack.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>
                <strong>TanStack Start</strong> & Router
              </li>
              <li>
                <strong>Better Auth</strong> & Zod
              </li>
              <li>
                <strong>Drizzle ORM</strong> & SQLite
              </li>
              <li>
                <strong>Tailwind v4</strong> & Shadcn UI
              </li>
              <li>
                <strong>React Hook Form</strong>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
