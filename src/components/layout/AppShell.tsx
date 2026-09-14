'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { sidebarOpen, loadNotes } = useNotesStore()
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const router = useRouter()

  useEffect(() => {
    if (user) loadNotes(user.id)
  }, [user, loadNotes])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable

      if (matchesHotkey(e, hotkeys.openSettings)) {
        e.preventDefault()
        router.push('/settings')
      }
      if (matchesHotkey(e, hotkeys.openSearch) && !isEditing) {
        e.preventDefault()
        // search handled in sidebar
        document.dispatchEvent(new CustomEvent('orrery:open-search'))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkeys, router])

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 overflow-hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}
