'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  FileText, Tag, Folder, Archive, Trash2, Moon, Sun,
  Settings, Plus, Star, Users, LayoutTemplate,
} from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { SearchModal } from './SearchModal'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { notes, folders, createNote } = useNotesStore()
  const theme    = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function handler() { setMobileOpen(true) }
    document.addEventListener('orrery:open-sidebar', handler)
    return () => document.removeEventListener('orrery:open-sidebar', handler)
  }, [])

  useEffect(() => {
    function handler() { setSearchOpen(true) }
    document.addEventListener('orrery:open-search', handler)
    return () => document.removeEventListener('orrery:open-search', handler)
  }, [])

  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
    setMobileOpen(false)
  }

  function navigate(href: string) { router.push(href); setMobileOpen(false) }

  const isDark      = theme === 'dark'
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string

  function NavItem({ href, label, icon: Icon, count }: { href: string; label: string; icon: React.ElementType; count?: number }) {
    const active = pathname === href || (href !== '/home' && pathname.startsWith(href + '/'))
    return (
      <button
        type="button"
        onClick={() => navigate(href)}
        className={cn(
          'w-full flex items-center gap-x-2.5 py-1.5 px-2 text-sm rounded-md transition-colors focus:outline-none',
          active
            ? 'bg-[var(--bg-muted)] text-[var(--text)] font-medium'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]',
        )}
      >
        <Icon size={15} className="shrink-0 opacity-70" />
        <span className="flex-1 text-left truncate">{label}</span>
        {count !== undefined && (
          <span className="text-[10px] text-[var(--text-subtle)]">{count}</span>
        )}
      </button>
    )
  }

  function SectionLabel({ label }: { label: string }) {
    return (
      <p className="px-2 pt-4 pb-1 text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider select-none">
        {label}
      </p>
    )
  }

  return (
    <TooltipProvider>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar — no border, same bg as shell */}
      <div
        id="orrery-sidebar"
        role="navigation"
        aria-label="Sidebar"
        className={cn(
          'flex flex-col h-full overflow-x-hidden bg-[var(--bg)]',
          'transition-all duration-300 w-56 shrink-0',
          // mobile
          'fixed top-0 bottom-0 inset-s-0 z-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:block',
        )}
      >
        <div className="flex flex-col h-full">

          {/* Brand row — aligns with global topbar height (h-11) */}
          <div className="h-11 flex items-center px-3 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="white" />
                  <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                  <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[var(--text)] truncate">My Space</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-subtle)] shrink-0">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 pb-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">

            {/* New Document */}
            <button
              type="button"
              onClick={handleNewNote}
              className="w-full flex items-center gap-x-2.5 py-1.5 px-2 text-sm rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none mb-1"
            >
              <Plus size={15} className="shrink-0 opacity-70" />
              <span>New Document</span>
            </button>

            {/* Main nav */}
            <NavItem href="/all-docs" label="All Docs"  icon={FileText} count={notes.length} />
            <NavItem href="/labels"   label="Tags"      icon={Tag} />
            <NavItem href="/folders"  label="Folders"   icon={Folder} />
            <NavItem href="/archive"  label="Archive"   icon={Archive} />
            <NavItem href="/trash"    label="Trash"     icon={Trash2} />

            {/* Starred section */}
            <SectionLabel label="Starred" />
            <p className="px-2 py-1 text-xs text-[var(--text-subtle)] italic">Star Docs to keep them close</p>

            {/* Folders section */}
            {folders.length > 0 && (
              <>
                <SectionLabel label="Folders" />
                {folders.slice(0, 8).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate('/folders')}
                    className="w-full flex items-center gap-x-2.5 py-1.5 px-2 text-sm rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                  >
                    <span className="text-base leading-none shrink-0">📁</span>
                    <span className="flex-1 text-left truncate">{f.name}</span>
                  </button>
                ))}
              </>
            )}

            {/* Tags section */}
            <SectionLabel label="Tags" />
            {(() => {
              const allTags = Array.from(new Set(notes.flatMap((n) => n.tags ?? [])))
              return allTags.length === 0
                ? <p className="px-2 py-1 text-xs text-[var(--text-subtle)] italic">Pin your key tags for quick access</p>
                : allTags.slice(0, 8).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => navigate('/labels')}
                      className="w-full flex items-center gap-x-2.5 py-1.5 px-2 text-sm rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                    >
                      <Tag size={13} className="shrink-0 opacity-60" />
                      <span className="flex-1 text-left truncate">{t}</span>
                    </button>
                  ))
            })()}
          </nav>

          {/* Footer */}
          <div className="shrink-0 px-2 pb-3 flex items-center gap-1">
            <button
              onClick={() => { router.push('/settings'); setMobileOpen(false) }}
              className="flex items-center gap-2 flex-1 min-w-0 rounded-md px-2 py-1.5 hover:bg-[var(--bg-muted)] transition-colors focus:outline-none"
              aria-label="Settings"
            >
              <Avatar.Root className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Avatar.Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                <Avatar.Fallback className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-[9px] font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <span className="text-xs text-[var(--text-muted)] truncate">{displayName}</span>
            </button>
            <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-md focus:outline-none transition-colors"
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            </Tooltip>
            <Tooltip content="Settings">
              <button
                type="button"
                onClick={() => router.push('/settings')}
                className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-md focus:outline-none transition-colors"
              >
                <Settings size={13} />
              </button>
            </Tooltip>
          </div>

        </div>
      </div>
    </TooltipProvider>
  )
}
