'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) loadSettings(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadSettings(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, loadSettings])

  return <>{children}</>
}
