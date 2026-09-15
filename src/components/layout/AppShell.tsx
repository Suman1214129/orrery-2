'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { SettingsModal } from './SettingsModal'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { loadNotes } = useNotesStore()
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const router   = useRouter()
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isEditor = pathname.startsWith('/editor/')

  useEffect(() => {
    if (user) loadNotes(user.id)
  }, [user, loadNotes])

  useEffect(() => {
    function handler() { setSettingsOpen(true) }
    document.addEventListener('orrery:open-settings', handler)
    return () => document.removeEventListener('orrery:open-settings', handler)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable
      if (matchesHotkey(e, hotkeys.openSettings)) { e.preventDefault(); setSettingsOpen(true) }
      if (matchesHotkey(e, hotkeys.openSearch) && !isEditing && !isEditor) {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('orrery:open-search'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkeys, router, isEditor])

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      {!isEditor && <Sidebar onOpenSettings={() => setSettingsOpen(true)} />}
      <div className="flex-1 min-w-0 overflow-hidden bg-[var(--bg)]">
        {children}
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
