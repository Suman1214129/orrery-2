'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function ErrorFromParams({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('error')) onError('Sign in failed. Please try again.')
  }, [searchParams, onError])
  return null
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [loading, setLoading] = useState<'google' | 'magic' | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading('magic')
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/home` },
    })
    if (error) { setError(error.message); setLoading(null) }
    else { setMagicSent(true); setLoading(null) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm"
    >
      <Suspense fallback={null}>
        <ErrorFromParams onError={setError} />
      </Suspense>

      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--accent)] mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" />
              <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6" />
              <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
              <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8" />
              <circle cx="5" cy="8" r="1" fill="white" opacity="0.6" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Orrery</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Branching writing, explored.</p>
        </div>

        {magicSent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-3">
              <Mail size={18} className="text-[var(--accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text)]">Check your email</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              We sent a magic link to <span className="font-medium">{email}</span>
            </p>
            <button onClick={() => setMagicSent(false)} className="mt-4 text-xs text-[var(--accent)] hover:underline">
              Use a different email
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <Button variant="outline" size="lg" className="w-full" onClick={signInWithGoogle} disabled={loading !== null}>
              {loading === 'google' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--surface)] px-2 text-xs text-[var(--text-subtle)]">or</span>
              </div>
            </div>

            <form onSubmit={sendMagicLink} className="space-y-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" size="lg" className="w-full" disabled={loading !== null || !email}>
                {loading === 'magic' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Send magic link
              </Button>
            </form>

            {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[var(--text-subtle)] mt-4">
        By signing in you agree to our terms of service.
      </p>
    </motion.div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] p-8 flex items-center justify-center h-64">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
