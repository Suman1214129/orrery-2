'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, Plus, FolderPlus, Settings, ChevronRight,
  FileText, Folder, Trash2, MoreHorizontal, PanelLeftClose,
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

export function Sidebar() {
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    notes, folders, activeNoteId, searchQuery,
    setActiveNote, setSidebarOpen, setSearchQuery,
    createNote, deleteNote, createFolder,
  } = useNotesStore()

  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler() { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
    document.addEventListener('orrery:open-search', handler)
    return () => document.removeEventListener('orrery:open-search', handler)
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
  }

  async function handleNewFolder() {
    if (!user) return
    const name = prompt('Folder name:')
    if (name) await createFolder(user.id, name)
  }

  function openNote(note: Note) {
    setActiveNote(note.id)
    router.push(`/editor/${note.id}`)
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full w-[260px] border-r border-[var(--border)] bg-[var(--bg-subtle)]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="white" />
                <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
                <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--text)]">Orrery</span>
          </div>
          <div className="flex items-center gap-0.5">
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
            <Tooltip content="Collapse sidebar">
              <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose size={15} />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
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

        {/* Notes list */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className="h-full w-full">
            <div className="px-2 pb-4 space-y-0.5">
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
                <div>
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
                </div>
              )}

              {filtered.length === 0 && (
                <div className="px-2 py-8 text-center">
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
                </div>
              )}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" className="flex w-1.5 touch-none select-none p-0.5">
            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[var(--border)]" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        {/* Footer: user + settings */}
        <div className="border-t border-[var(--border)] p-2 flex items-center gap-2">
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 flex-1 min-w-0 rounded-[var(--radius)] px-2 py-1.5 hover:bg-[var(--bg-muted)] transition-colors"
          >
            <Avatar.Root className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <Avatar.Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              <Avatar.Fallback className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-[10px] font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            <span className="text-xs text-[var(--text-muted)] truncate">{displayName}</span>
          </button>
          <Tooltip content="Settings (Ctrl+,)">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/settings')}>
              <Settings size={14} />
            </Button>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

function NoteItem({
  note, active, onOpen, onDelete,
}: {
  note: Note; active: boolean; onOpen: () => void; onDelete: () => void
}) {
  return (
    <motion.div
      layout
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius)] cursor-pointer transition-colors',
        active
          ? 'bg-[var(--accent-light)] text-[var(--accent)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
      )}
      onClick={onOpen}
    >
      <FileText size={13} className="flex-shrink-0 opacity-70" />
      <span className="flex-1 text-xs truncate">{note.title || 'Untitled'}</span>
      <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0">
        {formatDate(note.updated_at)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
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
    </motion.div>
  )
}

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
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--radius)] text-xs text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors">
          <ChevronRight
            size={12}
            className={cn('transition-transform flex-shrink-0', open && 'rotate-90')}
          />
          <Folder size={13} className="flex-shrink-0 opacity-70" />
          <span className="truncate">{folder.name}</span>
          <span className="ml-auto text-[10px] opacity-50">{notes.length}</span>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="ml-3 pl-2 border-l border-[var(--border-subtle)] space-y-0.5 mt-0.5">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              active={activeNoteId === note.id}
              onOpen={() => onOpenNote(note)}
              onDelete={() => onDeleteNote(note.id)}
            />
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
