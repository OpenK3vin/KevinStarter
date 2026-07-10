import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IconFolder,
  IconShieldLock,
  IconCode,
  IconLogin,
} from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="flex flex-col gap-6 py-12 px-4 md:px-8 max-w-6xl mx-auto rise-in w-full">
      <div className="flex flex-col items-center text-center gap-4 py-12">
        <h1 className="text-5xl font-bold tracking-tight display-title">
          Welcome to KevinPulse Starter
        </h1>

        {!isPending && session ? (
          <p className="text-muted-foreground text-xl">
            You are currently logged in as{" "}
            <span className="font-semibold text-foreground">
              {session.user.email}
            </span>
            .
          </p>
        ) : !isPending ? (
          <p className="text-muted-foreground text-xl max-w-2xl">
            A production-ready TanStack Start template with RBAC, Drizzle ORM,
            and modern UI components.
          </p>
        ) : (
          <p className="text-muted-foreground text-xl max-w-2xl">Loading...</p>
        )}

        {!session && !isPending && (
          <div className="mt-4">
            <Button size="lg" asChild>
              <Link to="/login" className="gap-2">
                <IconLogin className="w-5 h-5" />
                Sign In to Test Authentication
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {/* Auth Testing Card */}
        <Card className="island-shell border-none flex flex-col">
          <CardHeader>
            <IconShieldLock className="w-8 h-8 mb-4 text-sea-ink" />
            <CardTitle>Authentication & Roles</CardTitle>
            <CardDescription>
              Test out global role-based access control (RBAC).
            </CardDescription>
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
        <Card className="island-shell border-none flex flex-col">
          <CardHeader>
            <IconFolder className="w-8 h-8 mb-4 text-sea-ink" />
            <CardTitle>Resource Authorization</CardTitle>
            <CardDescription>
              Granular permissions per resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">
              Head over to the Projects section. You can only view or edit
              projects that you have been explicitly granted access to,
              demonstrating row-level security and granular resource roles.
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
        <Card className="island-shell border-none flex flex-col">
          <CardHeader>
            <IconCode className="w-8 h-8 mb-4 text-sea-ink" />
            <CardTitle>Built with the best</CardTitle>
            <CardDescription>Modern React stack.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-2">
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
  );
}
