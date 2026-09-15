'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Folder, FileText, ChevronRight, Plus, FolderPlus } from 'lucide-react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { cn, formatDate } from '@/lib/utils'

export default function FoldersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notes, folders, createNote, createFolder } = useNotesStore()

  async function handleNewFolder() {
    if (!user) return
    const name = prompt('Folder name:')
    if (name) await createFolder(user.id, name)
  }

  async function handleNewNoteInFolder(folderId: string) {
    if (!user) return
    const note = await createNote(user.id, folderId)
    router.push(`/editor/${note.id}`)
  }

  const rootFolders = folders.filter((f) => !f.parent_id)
  const unfiled = notes.filter((n) => !n.folder_id)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--text-subtle)]">{folders.length} folder{folders.length !== 1 ? 's' : ''}</span>
        <Button size="sm" variant="outline" onClick={handleNewFolder}><FolderPlus size={14} /> New folder</Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {folders.length === 0 && unfiled.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Folder size={32} className="text-[var(--text-subtle)]" />
            <p className="text-sm text-[var(--text-muted)]">No folders yet</p>
            <Button size="sm" onClick={handleNewFolder}><FolderPlus size={14} /> Create a folder</Button>
          </div>
        ) : (
          <div className="space-y-1">
            {rootFolders.map((folder) => {
              const folderNotes = notes.filter((n) => n.folder_id === folder.id)
              return (
                <FolderRow
                  key={folder.id}
                  name={folder.name}
                  notes={folderNotes}
                  onOpenNote={(id) => router.push(`/editor/${id}`)}
                  onNewNote={() => handleNewNoteInFolder(folder.id)}
                />
              )
            })}

            {unfiled.length > 0 && (
              <FolderRow
                name="Unfiled"
                notes={unfiled}
                onOpenNote={(id) => router.push(`/editor/${id}`)}
                muted
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FolderRow({
  name, notes, onOpenNote, onNewNote, muted,
}: {
  name: string
  notes: { id: string; title: string; updated_at: string }[]
  onOpenNote: (id: string) => void
  onNewNote?: () => void
  muted?: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <Collapsible.Trigger asChild>
          <button className="flex-1 flex items-center gap-2 py-2 px-2 rounded-[var(--radius)] hover:bg-[var(--bg-muted)] transition-colors text-left group">
            <ChevronRight size={12} className={cn('shrink-0 transition-transform text-[var(--text-subtle)]', open && 'rotate-90')} />
            <Folder size={14} className={cn('shrink-0', muted ? 'text-[var(--text-subtle)]' : 'text-[var(--accent)]')} />
            <span className={cn('text-xs font-medium truncate', muted ? 'text-[var(--text-muted)]' : 'text-[var(--text)]')}>{name}</span>
            <span className="ml-auto text-[10px] text-[var(--text-subtle)]">{notes.length}</span>
          </button>
        </Collapsible.Trigger>
        {onNewNote && (
          <button
            onClick={onNewNote}
            className="flex items-center justify-center size-6 rounded-[var(--radius)] text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent)] transition-colors"
            aria-label="New note in folder"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      <Collapsible.Content>
        <ul className="ml-6 pl-2 border-l border-[var(--border-subtle)] space-y-0.5 mb-1">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                onClick={() => onOpenNote(note.id)}
                className="w-full flex items-center gap-2 py-1.5 px-2 text-left hover:bg-[var(--bg-muted)] rounded-[var(--radius)] transition-colors group"
              >
                <FileText size={13} className="text-[var(--text-subtle)] shrink-0" />
                <span className="flex-1 text-xs text-[var(--text)] truncate">{note.title || 'Untitled'}</span>
                <span className="text-[10px] text-[var(--text-subtle)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatDate(note.updated_at)}
                </span>
              </button>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="py-1.5 px-2 text-[10px] text-[var(--text-subtle)]">Empty folder</li>
          )}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
