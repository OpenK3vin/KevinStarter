import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    })

    setIsLoading(false)

    if (signUpError) {
      setError(signUpError.message ?? 'Registration failed. Please try again.')
      return
    }

    await router.invalidate()
    router.navigate({ to: '/' })
  }

  async function handleGoogleSignUp() {
    setIsLoading(true)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
  }

  return (
    <div className="space-y-6 rise-in">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold display-title text-sea-ink">Create an account</h1>
        <p className="text-sea-ink-soft text-sm">Get started — it only takes a moment</p>
      </div>

      <Card className="island-shell border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Register</CardTitle>
          <CardDescription>Fill in the details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                id="register-error"
                role="alert"
                className="px-4 py-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="register-name" className="text-sm font-medium text-sea-ink">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background placeholder:text-sea-ink-soft focus:outline-none focus:ring-2 focus:ring-sea-ink/30 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-sm font-medium text-sea-ink">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background placeholder:text-sea-ink-soft focus:outline-none focus:ring-2 focus:ring-sea-ink/30 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="register-password" className="text-sm font-medium text-sea-ink">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-background placeholder:text-sea-ink-soft focus:outline-none focus:ring-2 focus:ring-sea-ink/30 transition"
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-sea-ink text-white text-sm font-medium transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 flex items-center before:flex-1 before:border-t before:border-line after:flex-1 after:border-t after:border-line">
            <span className="px-3 text-xs text-sea-ink-soft uppercase tracking-wider">or</span>
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="mt-4 w-full py-2.5 px-4 rounded-lg border border-line bg-background text-sea-ink text-sm font-medium transition hover:bg-sea-ink/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-sea-ink-soft">
        Already have an account?{' '}
        <Link
          id="register-to-login"
          to="/login"
          className="font-medium text-sea-ink underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
