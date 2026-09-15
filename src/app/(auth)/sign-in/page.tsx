'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function ErrorFromParams({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('error')) onError('Sign in failed. Please try again.')
  }, [searchParams, onError])
  return null
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState<'google' | 'submit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)

  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading('google')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=/home` },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailInvalid = !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const passwordInvalid = password.length < 8
    setEmailError(emailInvalid)
    setPasswordError(passwordInvalid)
    if (emailInvalid || passwordInvalid) return

    setLoading('submit')
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(null) }
    else { window.location.href = '/home' }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <Suspense fallback={null}>
        <ErrorFromParams onError={setError} />
      </Suspense>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[0_1px_4px_0_rgb(0_0_0/0.06),0_4px_24px_0_rgb(0_0_0/0.06)] p-4 sm:p-7">

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">Sign in</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Don&apos;t have an account yet?{' '}
            <Link href="/sign-up" className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium decoration-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Google button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={signInWithGoogle}
          disabled={loading !== null}
        >
          {loading === 'google' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Sign in with Google
        </Button>

        {/* Or divider */}
        <div className="flex items-center gap-x-2 py-3 before:flex-1 before:border-t before:border-[var(--border)] after:flex-1 after:border-t after:border-[var(--border)]">
          <span className="text-xs uppercase text-[var(--text-subtle)] font-medium">Or</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(false) }}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  aria-invalid={emailError}
                  className={cn(emailError && 'border-red-500 focus:ring-red-500 focus:border-red-500 pr-10')}
                />
                <div className={cn('absolute inset-y-0 right-3 flex items-center pointer-events-none', !emailError && 'hidden')} aria-hidden="true">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
              </div>
              <p id="email-error" className={cn('mt-1.5 text-xs text-red-500', !emailError && 'hidden')}>
                Please include a valid email address so we can get back to you
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(false) }}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  aria-invalid={passwordError}
                  className={cn(passwordError && 'border-red-500 focus:ring-red-500 focus:border-red-500 pr-10')}
                />
                <div className={cn('absolute inset-y-0 right-3 flex items-center pointer-events-none', !passwordError && 'hidden')} aria-hidden="true">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
              </div>
              <p id="password-error" className={cn('mt-1.5 text-xs text-red-500', !passwordError && 'hidden')}>
                8+ characters required
              </p>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-x-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-[var(--text-muted)] cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <Button type="submit" size="lg" className="w-full" disabled={loading !== null}>
              {loading === 'submit' && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </Button>

            {/* Auth error */}
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-7 flex items-center justify-center h-64">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
