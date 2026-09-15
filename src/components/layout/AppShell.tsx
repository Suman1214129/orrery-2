'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { Search } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { loadNotes } = useNotesStore()
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const router = useRouter()

  useEffect(() => {
    if (user) loadNotes(user.id)
  }, [user, loadNotes])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable
      if (matchesHotkey(e, hotkeys.openSettings)) { e.preventDefault(); router.push('/settings') }
      if (matchesHotkey(e, hotkeys.openSearch) && !isEditing) {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('orrery:open-search'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkeys, router])

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[var(--bg)]">

      {/* ── Global top bar — full width, seamless ── */}
      <div className="shrink-0 h-11 flex items-center gap-3 px-4 bg-[var(--bg)]">
        {/* Left spacer — aligns with sidebar width */}
        <div className="w-56 shrink-0" />

        {/* Centered search pill */}
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent('orrery:open-search'))}
          className="flex-1 max-w-sm flex items-center gap-2 h-7 px-3 rounded-lg bg-[var(--bg-muted)] text-sm text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] transition-colors focus:outline-none"
          aria-label="Search"
        >
          <Search size={13} className="shrink-0" />
          <span className="text-xs">Search…</span>
          <span className="ml-auto text-[10px] opacity-60">⌃K</span>
        </button>

        <div className="flex-1" />
      </div>

      {/* ── Body: sidebar + content, no border between them ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-hidden bg-[var(--bg)]">
          {children}
        </div>
      </div>
    </div>
  )
}
