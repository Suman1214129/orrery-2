'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'
import { Sidebar, SidebarMobileToggle } from './Sidebar'
import { Moon, Sun } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { loadNotes } = useNotesStore()
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
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

  const isDark = theme === 'dark'

  return (
    // Preline shell: h-dvh overflow-hidden, flex row (sidebar + main column)
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <Sidebar />

      {/* Main column: flex-col, shrink-0 toolbar + flex-1 content shell */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Toolbar (shrink-0) ── */}
        <div className="shrink-0 px-3 pt-2 pb-1.5 sm:px-4 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="flex items-center gap-2">

            {/* Mobile sidebar toggle */}
            <SidebarMobileToggle
              onClick={() => document.dispatchEvent(new CustomEvent('orrery:open-sidebar'))}
            />

            {/* Spacer — children pages inject their own toolbar content via portal or
                the topbar inside each page fills this row naturally since children
                render inside the content shell below. We keep this toolbar minimal:
                just the dark-mode toggle on the right. */}
            <div className="flex-1 min-w-0" />

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex size-8 shrink-0 justify-center items-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] focus:outline-none focus:bg-[var(--bg-muted)] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun className="shrink-0 size-4" />
                : <Moon className="shrink-0 size-4" />
              }
            </button>
          </div>
        </div>

        {/* ── Content shell (flex-1, rounded border, clips children) ── */}
        <div className="min-h-0 flex-1 overflow-hidden p-2">
          <div className="mx-auto w-full h-full max-w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {children}
          </div>
        </div>

      </div>
    </div>
  )
}
