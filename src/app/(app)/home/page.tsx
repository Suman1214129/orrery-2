'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, FileText, Clock } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { cn, formatDate } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notes, createNote } = useNotesStore()

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
  }

  const recent = notes.slice(0, 20)

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {recent.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-4"
            >
              <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--accent-light)] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="var(--accent)" />
                  <circle cx="12" cy="12" r="7" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <circle cx="12" cy="12" r="11" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.25" />
                  <circle cx="19" cy="12" r="1.5" fill="var(--accent)" opacity="0.7" />
                  <circle cx="5" cy="8" r="1" fill="var(--accent)" opacity="0.5" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-[var(--text)]">Start writing</p>
                <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
                  Create a note, write freely, and branch off alternate paths whenever you wonder &ldquo;what if.&rdquo;
                </p>
              </div>
              <Button onClick={handleNewNote}>
                <Plus size={15} /> Create your first note
              </Button>
            </motion.div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[var(--text-subtle)]" />
                <span className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider">Recent</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* New note card */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleNewNote}
                  className="h-36 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                >
                  <Plus size={20} />
                  <span className="text-xs font-medium">New note</span>
                </motion.button>

                {recent.map((note, i) => (
                  <motion.button
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => router.push(`/editor/${note.id}`)}
                    className={cn(
                      'h-36 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-4 text-left',
                      'flex flex-col gap-2 hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)] transition-all'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <FileText size={14} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[var(--text)] truncate leading-tight">
                        {note.title || 'Untitled'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 flex-1 leading-relaxed">
                      {note.content.replace(/<[^>]+>/g, '').slice(0, 120) || 'Empty note'}
                    </p>
                    <span className="text-[10px] text-[var(--text-subtle)]">{formatDate(note.updated_at)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
