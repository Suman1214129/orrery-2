'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Plus } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function AllDocsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notes, createNote } = useNotesStore()

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-[var(--text)]">All Docs</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{notes.length} document{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={handleNewNote}><Plus size={14} /> New note</Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <FileText size={32} className="text-[var(--text-subtle)]" />
            <p className="text-sm text-[var(--text-muted)]">No documents yet</p>
            <Button size="sm" onClick={handleNewNote}><Plus size={14} /> Create one</Button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {notes.map((note, i) => (
              <motion.li
                key={note.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <button
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-[var(--bg-muted)] rounded-[var(--radius)] transition-colors group"
                >
                  <FileText size={14} className="text-[var(--accent)] shrink-0" />
                  <span className="flex-1 text-sm text-[var(--text)] truncate">{note.title || 'Untitled'}</span>
                  <span className="text-[10px] text-[var(--text-subtle)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDate(note.updated_at)}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
