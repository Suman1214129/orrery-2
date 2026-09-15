'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, FileText, LayoutGrid, List, Columns } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { cn, formatDate } from '@/lib/utils'

type ViewMode = 'grid' | 'list' | 'columns'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notes, folders, createNote } = useNotesStore()
  const [view, setView] = useState<ViewMode>('grid')

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
  }

  const recent = notes.slice(0, 20)

  function getFolderName(folderId: string | null) {
    if (!folderId) return null
    return folders.find((f) => f.id === folderId)?.name ?? null
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]+>/g, '').trim()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg)]">

      {/* ── Page top bar ── */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3">
        {/* Title with + button */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleNewNote}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--text)] text-[var(--bg)] hover:opacity-80 transition-opacity focus:outline-none shrink-0"
            aria-label="New document"
          >
            <Plus size={16} />
          </button>
          <h1 className="text-2xl font-bold text-[var(--text)] truncate">All Docs</h1>
        </div>

        {/* View controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
            {([
              { mode: 'grid' as ViewMode,    icon: LayoutGrid, label: 'Grid' },
              { mode: 'columns' as ViewMode, icon: Columns,    label: 'Columns' },
              { mode: 'list' as ViewMode,    icon: List,       label: 'List' },
            ] as const).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-label={label}
                className={cn(
                  'flex items-center justify-center w-8 h-8 transition-colors focus:outline-none',
                  view === mode
                    ? 'bg-[var(--bg-muted)] text-[var(--text)]'
                    : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)]'
                )}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {recent.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="var(--accent)" />
                <circle cx="12" cy="12" r="7" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.5" />
                <circle cx="12" cy="12" r="11" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.25" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text)]">Start writing</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
                Create a note, write freely, and branch off alternate paths whenever you wonder &ldquo;what if.&rdquo;
              </p>
            </div>
            <button
              onClick={handleNewNote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--text)] text-[var(--bg)] text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <Plus size={14} /> Create your first note
            </button>
          </motion.div>
        ) : view === 'list' ? (
          /* ── List view ── */
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((note, i) => (
              <motion.li
                key={note.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <button
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-[var(--bg-muted)] rounded-lg transition-colors group"
                >
                  <FileText size={14} className="text-[var(--text-subtle)] shrink-0" />
                  <span className="flex-1 text-sm text-[var(--text)] truncate">{note.title || 'Untitled'}</span>
                  {getFolderName(note.folder_id) && (
                    <span className="text-[10px] text-[var(--text-subtle)] shrink-0 flex items-center gap-1">
                      <FileText size={10} /> {getFolderName(note.folder_id)}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-subtle)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDate(note.updated_at)}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        ) : (
          /* ── Grid / Columns view ── */
          <div className={cn(
            'grid gap-3',
            view === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}>
            {/* New note card */}
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onClick={handleNewNote}
              className="h-52 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-subtle)] hover:border-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors"
            >
              <Plus size={22} />
              <span className="text-xs font-medium">New Document</span>
            </motion.button>

            {recent.map((note, i) => {
              const preview = stripHtml(note.content).slice(0, 200)
              const folder  = getFolderName(note.folder_id)
              return (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="h-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left flex flex-col gap-2 hover:border-[var(--text-subtle)] hover:shadow-sm transition-all overflow-hidden"
                >
                  {/* Card header */}
                  <div className="shrink-0">
                    <p className="text-sm font-semibold text-[var(--text)] leading-snug line-clamp-2">
                      {note.title || 'Untitled'}
                    </p>
                    {folder && (
                      <p className="flex items-center gap-1 text-[10px] text-[var(--text-subtle)] mt-0.5">
                        <FileText size={9} />
                        {folder}
                        <span className="mx-0.5">·</span>
                        {formatDate(note.updated_at)}
                      </p>
                    )}
                    {!folder && (
                      <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">{formatDate(note.updated_at)}</p>
                    )}
                  </div>

                  {/* Content preview */}
                  <div className="flex-1 overflow-hidden">
                    {preview ? (
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-5">
                        {preview}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-subtle)] italic">Empty document</p>
                    )}
                  </div>

                  {/* Tags */}
                  {note.tags?.length > 0 && (
                    <div className="shrink-0 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-[9px] rounded-md bg-[var(--bg-muted)] text-[var(--text-subtle)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
