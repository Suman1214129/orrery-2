'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Tag, Folder, Archive, Trash2, Moon, Sun, Settings, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const { notes, folders } = useNotesStore()
  const theme    = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [collapsed,   setCollapsed]   = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)

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

  function navigate(href: string) { router.push(href); setMobileOpen(false) }

  // home and all-docs are the same screen — both highlight all-docs
  function isActive(href: string) {
    if (href === '/all-docs') return pathname === '/all-docs' || pathname === '/home'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isDark      = theme === 'dark'
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string

  const NAV = [
    { href: '/all-docs', label: 'All Docs', icon: FileText, count: notes.length },
    { href: '/labels',   label: 'Tags',     icon: Tag },
    { href: '/folders',  label: 'Folders',  icon: Folder },
    { href: '/archive',  label: 'Archive',  icon: Archive },
    { href: '/trash',    label: 'Trash',    icon: Trash2 },
  ]

  const sidebarW = collapsed ? 'w-14' : 'w-60'

  return (
    <TooltipProvider>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div
        id="orrery-sidebar"
        role="navigation"
        aria-label="Sidebar"
        className={cn(
          'flex flex-col h-full bg-[var(--bg)] transition-all duration-200 shrink-0 overflow-hidden',
          sidebarW,
          'fixed top-0 bottom-0 inset-s-0 z-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:block',
        )}
      >
        <div className="flex flex-col h-full">

          {/* Header row — aligns with global topbar */}
          <div className="h-11 flex items-center px-3 shrink-0 gap-2">
            {!collapsed && (
              <span className="flex-1 text-sm font-semibold text-[var(--text)] truncate">My Space</span>
            )}
            <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <button
                type="button"
                onClick={() => setCollapsed(v => !v)}
                className="flex items-center justify-center size-8 rounded-lg text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none shrink-0"
                aria-label={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </Tooltip>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
            {NAV.map(({ href, label, icon: Icon, count }) => {
              const active = isActive(href)
              return (
                <Tooltip key={href} content={collapsed ? label : ''} side="right">
                  <button
                    type="button"
                    onClick={() => navigate(href)}
                    className={cn(
                      'w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-[15px] transition-colors focus:outline-none',
                      active
                        ? 'bg-[var(--bg-muted)] text-[var(--text)] font-medium'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]',
                      collapsed && 'justify-center px-2',
                    )}
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
                    {!collapsed && count !== undefined && (
                      <span className="text-xs text-[var(--text-subtle)]">{count}</span>
                    )}
                  </button>
                </Tooltip>
              )
            })}

            {/* Starred */}
            {!collapsed && (
              <>
                <p className="px-2.5 pt-5 pb-1 text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">Starred</p>
                <p className="px-2.5 py-1 text-[13px] text-[var(--text-subtle)] italic">Star docs to keep them close</p>
              </>
            )}

            {/* Folders */}
            {!collapsed && folders.length > 0 && (
              <>
                <p className="px-2.5 pt-5 pb-1 text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">Folders</p>
                {folders.slice(0, 8).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate('/folders')}
                    className="w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-[15px] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                  >
                    <Folder size={16} className="shrink-0 opacity-60" />
                    <span className="flex-1 text-left truncate">{f.name}</span>
                  </button>
                ))}
              </>
            )}

            {/* Tags */}
            {!collapsed && (() => {
              const allTags = Array.from(new Set(notes.flatMap((n) => n.tags ?? [])))
              if (!allTags.length) return null
              return (
                <>
                  <p className="px-2.5 pt-5 pb-1 text-[11px] font-semibold text-[var(--text-subtle)] uppercase tracking-wider">Tags</p>
                  {allTags.slice(0, 8).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => navigate('/labels')}
                      className="w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-[15px] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none"
                    >
                      <Tag size={14} className="shrink-0 opacity-60" />
                      <span className="flex-1 text-left truncate">{t}</span>
                    </button>
                  ))}
                </>
              )
            })()}
          </nav>

          {/* Footer */}
          <div className="shrink-0 px-2 pb-3 pt-2 border-t border-[var(--border)] flex items-center gap-1">
            <button
              onClick={() => { router.push('/settings'); setMobileOpen(false) }}
              className={cn(
                'flex items-center gap-2 flex-1 min-w-0 rounded-lg px-2 py-2 hover:bg-[var(--bg-muted)] transition-colors focus:outline-none',
                collapsed && 'justify-center flex-none',
              )}
              aria-label="Settings"
            >
              <Avatar.Root className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <Avatar.Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                <Avatar.Fallback className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-[10px] font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              {!collapsed && <span className="text-sm text-[var(--text-muted)] truncate">{displayName}</span>}
            </button>
            {!collapsed && (
              <>
                <Tooltip content={isDark ? 'Light mode' : 'Dark mode'}>
                  <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="flex justify-center items-center size-8 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-lg focus:outline-none transition-colors">
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                </Tooltip>
                <Tooltip content="Settings">
                  <button type="button" onClick={() => router.push('/settings')} className="flex justify-center items-center size-8 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-lg focus:outline-none transition-colors">
                    <Settings size={15} />
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
