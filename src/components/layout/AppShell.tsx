'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { SettingsModal } from './SettingsModal'
import { Search } from 'lucide-react'

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
    <div className="flex flex-col h-dvh overflow-hidden bg-[var(--bg)]">
      {/* Top bar — search, hidden on editor */}
      {!isEditor && (
        <div className="shrink-0 h-11 flex items-center gap-3 px-4 bg-[var(--bg)]">
          <div className="w-60 shrink-0" />
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent('orrery:open-search'))}
            className="flex-1 max-w-md flex items-center gap-2.5 h-8 px-3.5 rounded-lg bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] border border-transparent hover:border-[var(--border)] transition-all focus:outline-none"
            aria-label="Search"
          >
            <Search size={13} className="shrink-0" />
            <span className="text-sm flex-1 text-left">Search…</span>
            <span className="text-xs opacity-40 shrink-0 font-mono">⌃K</span>
          </button>
          <div className="flex-1" />
        </div>
      )}

      {/* Body — sidebar + content side by side */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!isEditor && <Sidebar onOpenSettings={() => setSettingsOpen(true)} />}
        <div className="flex-1 min-w-0 overflow-hidden bg-[var(--bg)]">
          {children}
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
