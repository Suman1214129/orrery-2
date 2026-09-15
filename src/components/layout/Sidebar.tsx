'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, FolderPlus, Settings, ChevronRight,
  FileText, Folder, Trash2, MoreHorizontal, X,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Collapsible from '@radix-ui/react-collapsible'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { cn, formatDate } from '@/lib/utils'
import type { Note, Folder as FolderType } from '@/types'
import * as Avatar from '@radix-ui/react-avatar'

// ── Mobile toggle button rendered outside the sidebar ──────────────────────
export function SidebarMobileToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden inline-flex justify-center items-center gap-x-2 py-1.5 px-3 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] font-medium rounded-[var(--radius)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg-subtle)] focus:outline-none focus:bg-[var(--bg-subtle)] transition-colors"
      aria-label="Toggle navigation"
    >
      <svg className="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
      <span>Menu</span>
    </button>
  )
}

// ── Main Sidebar ────────────────────────────────────────────────────────────
export function Sidebar() {
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    notes, folders, activeNoteId, searchQuery,
    setActiveNote, setSidebarOpen, setSearchQuery,
    createNote, deleteNote, createFolder,
  } = useNotesStore()

  // mobileOpen: overlay on <lg; minified: icon-only on lg+
  const [mobileOpen, setMobileOpen] = useState(false)
  const [minified, setMinified] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // expose mobile open to AppShell via custom event
  useEffect(() => {
    function handler() { setMobileOpen(true) }
    document.addEventListener('orrery:open-sidebar', handler)
    return () => document.removeEventListener('orrery:open-sidebar', handler)
  }, [])

  useEffect(() => {
    function handler() { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
    document.addEventListener('orrery:open-search', handler)
    return () => document.removeEventListener('orrery:open-search', handler)
  }, [])

  // close mobile overlay on lg resize
  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const filtered = searchQuery
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  const rootNotes = filtered.filter((n) => !n.folder_id)
  const rootFolders = folders.filter((f) => !f.parent_id)

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
    setMobileOpen(false)
  }

  async function handleNewFolder() {
    if (!user) return
    const name = prompt('Folder name:')
    if (name) await createFolder(user.id, name)
  }

  function openNote(note: Note) {
    setActiveNote(note.id)
    router.push(`/editor/${note.id}`)
    setMobileOpen(false)
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string

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

      {/* Sidebar panel */}
      <div
        id="orrery-sidebar"
        role="dialog"
        aria-label="Sidebar"
        className={cn(
          // base
          'fixed top-0 bottom-0 inset-s-0 z-60 flex flex-col h-full overflow-x-hidden',
          'bg-[var(--bg-subtle)] border-r border-[var(--border)]',
          'transition-all duration-300',
          // width: minified on lg = w-13 (52px), normal = w-64
          minified ? 'lg:w-13' : 'lg:w-64',
          // mobile: translate off-screen unless open
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full',
          // lg: always visible, no translate
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
                className="flex justify-center items-center size-6 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-full focus:outline-none focus:bg-[var(--bg-muted)] transition-colors"
                aria-label="Close sidebar"
              >
                <X className="shrink-0 size-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Desktop minify toggle */}
            <div className="hidden lg:flex items-center gap-0.5">
              <Tooltip content={minified ? 'Expand sidebar' : 'Collapse sidebar'}>
                <button
                  type="button"
                  onClick={() => { setMinified((v) => !v); setSidebarOpen(!minified) }}
                  className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-full focus:outline-none focus:bg-[var(--bg-muted)] transition-colors"
                  aria-label={minified ? 'Expand navigation' : 'Minify navigation'}
                >
                  {minified
                    ? <PanelLeftOpen className="shrink-0 size-4" />
                    : <PanelLeftClose className="shrink-0 size-4" />
                  }
                  <span className="sr-only">Navigation Toggle</span>
                </button>
              </Tooltip>
              {!minified && (
                <>
                  <Tooltip content="New note (Ctrl+N)">
                    <Button variant="ghost" size="icon-sm" onClick={handleNewNote}>
                      <Plus size={15} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="New folder">
                    <Button variant="ghost" size="icon-sm" onClick={handleNewFolder}>
                      <FolderPlus size={15} />
                    </Button>
                  </Tooltip>
                </>
              )}
            </div>
          </header>

          {/* Search — hidden when minified */}
          <div className={cn('px-2 py-2 border-b border-[var(--border)]', minified && 'lg:hidden')}>
            {searchOpen ? (
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                  placeholder="Search notes…"
                  className="w-full h-7 pl-7 pr-2 text-xs rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            ) : (
              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
                className="w-full flex items-center gap-2 h-7 px-2.5 text-xs text-[var(--text-subtle)] rounded-[var(--radius)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                <Search size={13} />
                Search
                <span className="ml-auto text-[10px] opacity-60">⌃K</span>
              </button>
            )}
          </div>

          {/* Search icon-only when minified */}
          {minified && (
            <div className="hidden lg:flex px-2 py-2 border-b border-[var(--border)] justify-center">
              <Tooltip content="Search (Ctrl+K)">
                <button
                  onClick={() => { setMinified(false); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 80) }}
                  className="flex justify-center items-center size-7 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-[var(--radius)] transition-colors"
                  aria-label="Search"
                >
                  <Search size={14} />
                </button>
              </Tooltip>
            </div>
          )}

          {/* Body — notes list */}
          <nav
            className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]"
            aria-label="Notes navigation"
          >
            <div className={cn('pb-4 px-2 w-full flex flex-col flex-wrap', minified && 'lg:hidden')}>
              <ul className="space-y-0.5 mt-2">
                {/* Folders */}
                {rootFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    notes={notes.filter((n) => n.folder_id === folder.id)}
                    activeNoteId={activeNoteId}
                    onOpenNote={openNote}
                    onDeleteNote={deleteNote}
                  />
                ))}

                {/* Root notes */}
                {rootNotes.length > 0 && (
                  <li>
                    {rootFolders.length > 0 && (
                      <p className="px-2 pt-3 pb-1 text-[10px] font-medium text-[var(--text-subtle)] uppercase tracking-wider">
                        Notes
                      </p>
                    )}
                    {rootNotes.map((note) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        active={activeNoteId === note.id}
                        onOpen={() => openNote(note)}
                        onDelete={() => deleteNote(note.id)}
                      />
                    ))}
                  </li>
                )}

                {filtered.length === 0 && (
                  <li className="px-2 py-8 text-center">
                    <p className="text-xs text-[var(--text-subtle)]">
                      {searchQuery ? 'No notes match your search.' : 'No notes yet.'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleNewNote}
                        className="mt-2 text-xs text-[var(--accent)] hover:underline"
                      >
                        Create your first note
                      </button>
                    )}
                  </li>
                )}
              </ul>
            </div>

            {/* Icon-only actions when minified */}
            {minified && (
              <div className="hidden lg:flex flex-col items-center gap-1 pt-2 px-1">
                <Tooltip content="New note (Ctrl+N)">
                  <button
                    onClick={handleNewNote}
                    className="flex justify-center items-center size-8 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-[var(--radius)] transition-colors"
                    aria-label="New note"
                  >
                    <Plus size={15} />
                  </button>
                </Tooltip>
                <Tooltip content="New folder">
                  <button
                    onClick={handleNewFolder}
                    className="flex justify-center items-center size-8 text-[var(--text-muted)] hover:bg-[var(--bg-muted)] rounded-[var(--radius)] transition-colors"
                    aria-label="New folder"
                  >
                    <FolderPlus size={15} />
                  </button>
                </Tooltip>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--border)] p-2 flex items-center gap-2">
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

// ── Note item ───────────────────────────────────────────────────────────────
function NoteItem({
  note, active, onOpen, onDelete,
}: {
  note: Note; active: boolean; onOpen: () => void; onDelete: () => void
}) {
  return (
    <li>
      <div
        className={cn(
          'group min-h-[36px] flex items-center gap-x-3.5 py-2 px-2.5 rounded-[var(--radius)] cursor-pointer transition-colors text-sm',
          active
            ? 'bg-[var(--accent-light)] text-[var(--accent)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
        )}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      >
        <FileText size={14} className="shrink-0 opacity-70" />
        <span className="flex-1 text-xs truncate">{note.title || 'Untitled'}</span>
        <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity shrink-0">
          {formatDate(note.updated_at)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--border)]"
              onClick={(e) => e.stopPropagation()}
              aria-label="Note options"
            >
              <MoreHorizontal size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onDelete} destructive>
              <Trash2 size={13} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

// ── Folder item ─────────────────────────────────────────────────────────────
function FolderItem({
  folder, notes, activeNoteId, onOpenNote, onDeleteNote,
}: {
  folder: FolderType
  notes: Note[]
  activeNoteId: string | null
  onOpenNote: (n: Note) => void
  onDeleteNote: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <li>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger asChild>
          <button className="min-h-[36px] w-full flex items-center gap-x-3.5 py-2 px-2.5 rounded-[var(--radius)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors">
            <ChevronRight
              size={12}
              className={cn('transition-transform shrink-0', open && 'rotate-90')}
            />
            <Folder size={14} className="shrink-0 opacity-70" />
            <span className="truncate text-xs">{folder.name}</span>
            <span className="ml-auto text-[10px] opacity-50">{notes.length}</span>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <ul className="ml-3 pl-2 border-l border-[var(--border-subtle)] space-y-0.5 mt-0.5">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                active={activeNoteId === note.id}
                onOpen={() => onOpenNote(note)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </ul>
        </Collapsible.Content>
      </Collapsible.Root>
    </li>
  )
}
