'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Plus, Search, SortAsc, SortDesc } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

type SortKey = 'updated_at' | 'title' | 'created_at'

export default function AllDocsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notes, createNote } = useNotesStore()

  const [query,   setQuery]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortAsc, setSortAsc] = useState(false)

  async function handleNewNote() {
    if (!user) return
    const note = await createNote(user.id)
    router.push(`/editor/${note.id}`)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = notes
    .filter((n) =>
      !query ||
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null
    return sortAsc
      ? <SortAsc size={11} className="inline ml-1 text-[var(--accent)]" />
      : <SortDesc size={11} className="inline ml-1 text-[var(--accent)]" />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)] flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter documents…"
            className="w-full h-8 pl-7 pr-3 text-sm rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <span className="text-xs text-[var(--text-subtle)] shrink-0">{filtered.length} doc{filtered.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={handleNewNote}><Plus size={14} /> New</Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <FileText size={32} className="text-[var(--text-subtle)]" />
            <p className="text-sm text-[var(--text-muted)]">{query ? 'No results' : 'No documents yet'}</p>
            {!query && <Button size="sm" onClick={handleNewNote}><Plus size={14} /> Create one</Button>}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-[var(--surface)] z-10">
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-subtle)] w-full">
                  <button onClick={() => toggleSort('title')} className="hover:text-[var(--text)] transition-colors">
                    Title <SortIcon col="title" />
                  </button>
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-subtle)] whitespace-nowrap hidden sm:table-cell">
                  <button onClick={() => toggleSort('created_at')} className="hover:text-[var(--text)] transition-colors">
                    Created <SortIcon col="created_at" />
                  </button>
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-[var(--text-subtle)] whitespace-nowrap">
                  <button onClick={() => toggleSort('updated_at')} className="hover:text-[var(--text)] transition-colors">
                    Modified <SortIcon col="updated_at" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((note, i) => (
                <motion.tr
                  key={note.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => router.push(`/editor/${note.id}`)}
                  className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)] cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <FileText size={14} className="text-[var(--accent)] shrink-0" />
                      <span className="text-[var(--text)] truncate max-w-xs">{note.title || 'Untitled'}</span>
                      {note.tags?.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          {note.tags.slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--accent-light)] text-[var(--accent)]">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-subtle)] whitespace-nowrap hidden sm:table-cell">
                    {formatDate(note.created_at)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-subtle)] whitespace-nowrap">
                    {formatDate(note.updated_at)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
