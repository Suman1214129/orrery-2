'use client'
import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settings'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) =>
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  return <>{children}</>
}
