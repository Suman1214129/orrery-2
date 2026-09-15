'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, FileText, LayoutGrid, List, Table2, SortAsc, SortDesc } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { cn, formatDate } from '@/lib/utils'

type ViewMode = 'grid' | 'list' | 'table'
type SortKey = 'updated_at' | 'title' | 'created_at'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notes, folders, createNote } = useNotesStore()
  const [view, setView] = useState<ViewMode>('grid')
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortAsc, setSortAsc] = useState(false)

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  function getFolderName(folderId: string | null) {
    if (!folderId) return null
    return folders.find(f => f.id === folderId)?.name ?? null
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]+>/g, '').trim()
  }

  const filtered = notes
    .sort((a, b) => {
      const va = a[sortKey] ?? '', vb = b[sortKey] ?? ''
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null
    return sortAsc
      ? <SortAsc size={11} className="inline ml-1 text-[var(--accent)]" />
      : <SortDesc size={11} className="inline ml-1 text-[var(--accent)]" />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg)]">

      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-[var(--border)]">
        <span className="text-xs text-[var(--text-subtle)]">{filtered.length} doc{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex-1" />
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
          {([['grid', LayoutGrid], ['list', List], ['table', Table2]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)}
              className={cn('flex items-center justify-center w-8 h-8 transition-colors focus:outline-none',
                view === v ? 'bg-[var(--bg-muted)] text-[var(--text)]' : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)]')}>
              <Icon size={14} />
            </button>
          ))}
        </div>
        <button onClick={handleNewNote}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--text)] text-[var(--bg)] text-xs font-medium hover:opacity-80 transition-opacity">
          <Plus size={13} /> New
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filtered.length === 0 ? (
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

        ) : view === 'table' ? (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-[var(--bg)] z-10">
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-subtle)] w-full">
                  <button onClick={() => toggleSort('title')} className="hover:text-[var(--text)] transition-colors">
                    Title <SortIcon col="title" />
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-subtle)] whitespace-nowrap hidden sm:table-cell">
                  <button onClick={() => toggleSort('created_at')} className="hover:text-[var(--text)] transition-colors">
                    Created <SortIcon col="created_at" />
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-subtle)] whitespace-nowrap">
                  <button onClick={() => toggleSort('updated_at')} className="hover:text-[var(--text)] transition-colors">
                    Modified <SortIcon col="updated_at" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((note, i) => (
                <motion.tr key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <FileText size={14} className="text-[var(--text-subtle)] shrink-0" />
                      <span className="text-[var(--text)] truncate max-w-xs">{note.title || 'Untitled'}</span>
                      {note.tags?.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          {note.tags.slice(0, 3).map(t => (
                            <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--bg-muted)] text-[var(--text-subtle)]">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--text-subtle)] whitespace-nowrap hidden sm:table-cell">{formatDate(note.created_at)}</td>
                  <td className="px-3 py-2.5 text-xs text-[var(--text-subtle)] whitespace-nowrap">{formatDate(note.updated_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>

        ) : view === 'list' ? (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.map((note, i) => (
              <motion.li key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <button onClick={() => router.push(`/editor/${note.id}`)}
                  className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-[var(--bg-muted)] rounded-lg transition-colors group">
                  <FileText size={14} className="text-[var(--text-subtle)] shrink-0" />
                  <span className="flex-1 text-sm text-[var(--text)] truncate">{note.title || 'Untitled'}</span>
                  <span className="text-xs text-[var(--text-subtle)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{formatDate(note.updated_at)}</span>
                </button>
              </motion.li>
            ))}
          </ul>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <motion.button whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }} onClick={handleNewNote}
              className="h-52 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-subtle)] hover:border-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors">
              <Plus size={22} />
              <span className="text-xs font-medium">New Document</span>
            </motion.button>
            {filtered.map((note, i) => {
              const preview = stripHtml(note.content).slice(0, 200)
              const folder = getFolderName(note.folder_id)
              return (
                <motion.button key={note.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                  whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="h-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left flex flex-col gap-2 hover:border-[var(--text-subtle)] hover:shadow-sm transition-all overflow-hidden">
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
