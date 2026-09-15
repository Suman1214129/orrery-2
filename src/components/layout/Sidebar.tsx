'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search, Plus, Settings,
  FileText, Tag, Folder, Archive, Trash2,
  X, PanelLeftClose, PanelLeftOpen, Moon, Sun,
} from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/all-docs', label: 'All Docs',  icon: FileText },
  { href: '/labels',   label: 'Labels',    icon: Tag      },
  { href: '/folders',  label: 'Folders',   icon: Folder   },
  { href: '/archive',  label: 'Archive',   icon: Archive  },
  { href: '/trash',    label: 'Trash',     icon: Trash2   },
]

export function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { createNote } = useNotesStore()
  const theme    = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [minified,   setMinified]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal,  setSearchVal]  = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler() { setMobileOpen(true) }
    document.addEventListener('orrery:open-sidebar', handler)
    return () => document.removeEventListener('orrery:open-sidebar', handler)
  }, [])

  useEffect(() => {
    function handler() {
      setSearchOpen(true)
      setTimeout(() => searchRef.current?.focus(), 50)
    }
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

  function navigate(href: string) {
    router.push(href)
    setMobileOpen(false)
  }

  const isDark = theme === 'dark'
  const avatarUrl    = user?.user_metadata?.avatar_url as string | undefined
  const displayName  = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string

  return (
    <TooltipProvider>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="orrery-sidebar"
        role="dialog"
        aria-label="Sidebar"
        className={cn(
          'fixed top-0 bottom-0 inset-s-0 z-60 flex flex-col h-full overflow-x-hidden',
          'bg-[var(--bg-subtle)] border-r border-[var(--border)]',
          'transition-all duration-300',
          minified ? 'lg:w-13' : 'lg:w-64',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:block',
        )}
      >
        <div className="relative flex flex-col h-full max-h-full">

          {/* Header */}
          <header className="py-3 px-2 flex justify-between items-center gap-x-2 border-b border-[var(--border)]">
            {/* Brand */}
            <a
              href="/home"
              aria-label="Orrery"
              className={cn(
                'flex items-center gap-2 font-semibold text-sm text-[var(--text)] focus:outline-none focus:opacity-80 min-w-0',
                minified && 'lg:hidden',
              )}
            >
              <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="white" />
                  <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                  <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8" />
                </svg>
              </div>
              Orrery
            </a>

            {/* Brand icon-only when minified */}
            {minified && (
              <a
                href="/home"
                aria-label="Orrery"
                className="hidden lg:flex w-6 h-6 rounded-md bg-[var(--accent)] items-center justify-center flex-shrink-0 focus:outline-none focus:opacity-80"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="white" />
                  <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                  <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8" />
                </svg>
              </a>
            )}

            {/* Mobile close */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex justify-center items-center size-6 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-full focus:outline-none transition-colors"
                aria-label="Close sidebar"
              >
                <X className="shrink-0 size-4" />
              </button>
            </div>

            {/* Desktop controls */}
            <div className="hidden lg:flex items-center gap-0.5">
              {/* Search */}
              <Tooltip content="Search (Ctrl+K)">
                <button
                  type="button"
                  onClick={() => {
                    if (minified) setMinified(false)
                    setSearchOpen(true)
                    setTimeout(() => searchRef.current?.focus(), 80)
                  }}
                  className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-full focus:outline-none transition-colors"
                  aria-label="Search"
                >
                  <Search className="shrink-0 size-4" />
                </button>
              </Tooltip>

              {/* New note */}
              {!minified && (
                <Tooltip content="New note">
                  <Button variant="ghost" size="icon-sm" onClick={handleNewNote}>
                    <Plus size={15} />
                  </Button>
                </Tooltip>
              )}

              {/* Minify toggle */}
              <Tooltip content={minified ? 'Expand sidebar' : 'Collapse sidebar'}>
                <button
                  type="button"
                  onClick={() => setMinified((v) => !v)}
                  className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-full focus:outline-none transition-colors"
                  aria-label={minified ? 'Expand navigation' : 'Minify navigation'}
                >
                  {minified
                    ? <PanelLeftOpen className="shrink-0 size-4" />
                    : <PanelLeftClose className="shrink-0 size-4" />
                  }
                </button>
              </Tooltip>
            </div>
          </header>

          {/* Search bar — shown when open, hidden when minified */}
          {searchOpen && (
            <div className={cn('px-2 py-2 border-b border-[var(--border)]', minified && 'lg:hidden')}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                <input
                  ref={searchRef}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onBlur={() => { if (!searchVal) setSearchOpen(false) }}
                  placeholder="Search notes…"
                  className="w-full h-7 pl-7 pr-2 text-xs rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>
          )}

          {/* Nav menu */}
          <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Main navigation">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <button
                      type="button"
                      onClick={() => navigate(href)}
                      className={cn(
                        'w-full flex items-center gap-x-3 py-2 px-2.5 rounded-[var(--radius)] text-sm transition-colors',
                        active
                          ? 'bg-[var(--accent-light)] text-[var(--accent)] font-medium'
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]',
                        minified && 'lg:justify-center',
                      )}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className={cn('truncate text-xs', minified && 'lg:hidden')}>{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--border)] p-2 flex items-center gap-1">
            {/* Avatar / settings */}
            <button
              onClick={() => { router.push('/settings'); setMobileOpen(false) }}
              className={cn(
                'flex items-center gap-2 flex-1 min-w-0 rounded-[var(--radius)] px-2 py-1.5 hover:bg-[var(--bg-muted)] transition-colors',
                minified && 'lg:justify-center lg:flex-none',
              )}
              aria-label="Settings"
            >
              <Avatar.Root className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <Avatar.Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                <Avatar.Fallback className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-[10px] font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <span className={cn('text-xs text-[var(--text-muted)] truncate', minified && 'lg:hidden')}>
                {displayName}
              </span>
            </button>

            {/* Theme toggle */}
            {!minified && (
              <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-[var(--radius)] focus:outline-none transition-colors"
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? <Sun className="shrink-0 size-4" /> : <Moon className="shrink-0 size-4" />}
                </button>
              </Tooltip>
            )}

            {/* Settings icon */}
            {!minified && (
              <Tooltip content="Settings (Ctrl+,)">
                <Button variant="ghost" size="icon-sm" onClick={() => router.push('/settings')}>
                  <Settings size={14} />
                </Button>
              </Tooltip>
            )}
          </div>

        </div>
      </div>
    </TooltipProvider>
  )
}
