'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, FileText, LayoutGrid, List } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { cn, formatDate } from '@/lib/utils'

type ViewMode = 'grid' | 'masonry' | 'list'

// Masonry icon — Pinterest-style uneven grid
function MasonryIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="0" width="6" height="9" rx="1.2" />
      <rect x="0" y="10" width="6" height="6" rx="1.2" />
      <rect x="7" y="0" width="9" height="5" rx="1.2" />
      <rect x="7" y="6" width="9" height="10" rx="1.2" />
    </svg>
  )
}

// Deterministic "random" height from note id — gives stable masonry heights
function cardHeight(id: string, preview: string): number {
  const len = preview.length
  if (len === 0) return 120
  if (len < 80) return 140
  if (len < 180) return 200
  if (len < 320) return 260
  return 320
}

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

  function getFolderName(folderId: string | null) {
    if (!folderId) return null
    return folders.find(f => f.id === folderId)?.name ?? null
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]+>/g, '').trim()
  }

  const sorted = [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at))

  const views: [ViewMode, React.ReactNode][] = [
    ['grid', <LayoutGrid size={14} key="g" />],
    ['masonry', <MasonryIcon size={14} key="m" />],
    ['list', <List size={14} key="l" />],
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg)]">

      {/* "All Docs" heading row */}
      <div className="shrink-0 flex items-center gap-3 px-6 pt-5 pb-3">
        <h1 className="text-lg font-bold text-[var(--text)] flex-1">All Docs</h1>
        {/* View toggles */}
        <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
          {views.map(([v, icon]) => (
            <button key={v} onClick={() => setView(v)}
              className={cn('flex items-center justify-center w-8 h-8 transition-colors focus:outline-none',
                view === v ? 'bg-[var(--bg-muted)] text-[var(--text)]' : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)]')}>
              {icon}
            </button>
          ))}
        </div>
        <button onClick={handleNewNote}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--text)] text-[var(--bg)] text-xs font-medium hover:opacity-80 transition-opacity focus:outline-none">
          <Plus size={13} /> New
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-muted)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="var(--accent)" />
                <circle cx="12" cy="12" r="7" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.5" />
                <circle cx="12" cy="12" r="11" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.25" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--text)]">Start writing</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">Create a note, write freely, and branch off alternate paths.</p>
            </div>
            <button onClick={handleNewNote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--text)] text-[var(--bg)] text-sm font-medium hover:opacity-80 transition-opacity">
              <Plus size={14} /> Create your first note
            </button>
          </motion.div>

        ) : view === 'list' ? (
          <ul className="divide-y divide-[var(--border)]">
            {sorted.map((note, i) => (
              <motion.li key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <button onClick={() => router.push(`/editor/${note.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-[var(--bg-muted)] rounded-lg transition-colors group">
                  <FileText size={14} className="text-[var(--text-subtle)] shrink-0" />
                  <span className="flex-1 text-sm text-[var(--text)] truncate">{note.title || 'Untitled'}</span>
                  <span className="text-xs text-[var(--text-subtle)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{formatDate(note.updated_at)}</span>
                </button>
              </motion.li>
            ))}
          </ul>

        ) : view === 'masonry' ? (
          /* Pinterest / Keep-style masonry — CSS columns */
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-0">
            {sorted.map((note, i) => {
              const preview = stripHtml(note.content).slice(0, 400)
              const folder = getFolderName(note.folder_id)
              return (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="break-inside-avoid mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left flex flex-col gap-2 hover:border-[var(--text-subtle)] hover:shadow-sm transition-all overflow-hidden"
                >
                  <p className="text-sm font-semibold text-[var(--text)] leading-snug">{note.title || 'Untitled'}</p>
                  {preview && (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line">{preview}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-[var(--text-subtle)]">
                      {folder ? `${folder} · ` : ''}{formatDate(note.updated_at)}
                    </p>
                    {note.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {note.tags.slice(0, 2).map(t => (
                          <span key={t} className="px-1.5 py-0.5 text-[9px] rounded-md bg-[var(--bg-muted)] text-[var(--text-subtle)]">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

        ) : (
          /* Regular grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <motion.button whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }} onClick={handleNewNote}
              className="h-48 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-subtle)] hover:border-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors">
              <Plus size={22} />
              <span className="text-xs font-medium">New Document</span>
            </motion.button>
            {sorted.map((note, i) => {
              const preview = stripHtml(note.content).slice(0, 200)
              const folder = getFolderName(note.folder_id)
              return (
                <motion.button key={note.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                  whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="h-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left flex flex-col gap-2 hover:border-[var(--text-subtle)] hover:shadow-sm transition-all overflow-hidden">
                  <div className="shrink-0">
                    <p className="text-sm font-semibold text-[var(--text)] leading-snug line-clamp-2">{note.title || 'Untitled'}</p>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                      {folder ? `${folder} · ` : ''}{formatDate(note.updated_at)}
                    </p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {preview
                      ? <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-5">{preview}</p>
                      : <p className="text-xs text-[var(--text-subtle)] italic">Empty document</p>
                    }
                  </div>
                  {note.tags?.length > 0 && (
                    <div className="shrink-0 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 text-[9px] rounded-md bg-[var(--bg-muted)] text-[var(--text-subtle)]">{t}</span>
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
