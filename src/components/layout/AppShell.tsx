'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'
import { Sidebar } from './Sidebar'

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
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden p-2">
          <div className="mx-auto w-full h-full max-w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
