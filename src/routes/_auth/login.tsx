import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginValues) {
    setError(null)
    setIsLoading(true)

    const { error: signInError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })

    setIsLoading(false)

    if (signInError) {
      setError(signInError.message ?? 'Sign in failed. Please try again.')
      return
    }

    await router.invalidate()
    router.navigate({ to: '/' })
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
  }

  return (
    <div className="space-y-6 rise-in">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold display-title">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
      </div>

      <Card className="island-shell border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Sign In</CardTitle>
          <CardDescription>Enter your email and password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="px-4 py-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
                >
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </Form>

          <div className="mt-4 flex items-center before:flex-1 before:border-t before:border-border after:flex-1 after:border-t after:border-border">
            <span className="px-3 text-xs text-muted-foreground uppercase tracking-wider">or</span>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-4 w-full flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        No account yet?{' '}
        <Link
          id="login-to-register"
          to="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
