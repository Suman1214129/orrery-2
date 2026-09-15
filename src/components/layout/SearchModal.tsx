'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { formatDate } from '@/lib/utils'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter()
  const { notes } = useNotesStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const results = query.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.content.toLowerCase().includes(query.toLowerCase()),
      )
    : notes.slice(0, 8)

  // Group by folder_id presence
  const recent  = results.filter((n) => !n.folder_id)
  const inFolder = results.filter((n) => !!n.folder_id)

  function openNote(id: string) {
    router.push(`/editor/${id}`)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[79] bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed top-0 inset-x-0 z-80 flex justify-center px-3 pt-16 sm:pt-24 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="Search notes"
      >
        <div className="pointer-events-auto w-full sm:max-w-lg">
          <div className="flex flex-col bg-[var(--surface)] border border-[var(--border)] shadow-2xl rounded-xl overflow-hidden">

            {/* Input */}
            <div className="relative p-4 border-b border-[var(--border)]">
              <div className="relative">
                <label htmlFor="search-modal-input" className="sr-only">Search notes</label>
                <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-3.5">
                  <svg className="shrink-0 size-4 text-[var(--text-subtle)]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  id="search-modal-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes…"
                  className="py-2.5 ps-10 pe-4 block w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg sm:text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            {/* Results body */}
            <div className="h-80 p-2 rounded-b-xl overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-[var(--bg-muted)] [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-sm text-[var(--text-muted)]">No results for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                <>
                  {recent.length > 0 && (
                    <div>
                      <div className="text-xs uppercase text-[var(--text-subtle)] mx-3 mt-3 mb-1">
                        {query ? 'Notes' : 'Recent'}
                      </div>
                      {recent.map((note) => (
                        <NoteRow key={note.id} note={note} onOpen={() => openNote(note.id)} />
                      ))}
                    </div>
                  )}
                  {inFolder.length > 0 && (
                    <div>
                      <div className="text-xs uppercase text-[var(--text-subtle)] mx-3 mt-3 mb-1">In folders</div>
                      {inFolder.map((note) => (
                        <NoteRow key={note.id} note={note} onOpen={() => openNote(note.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

function NoteRow({ note, onOpen }: { note: { id: string; title: string; updated_at: string }; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="rounded-lg hover:bg-[var(--bg-muted)] focus:outline-none focus:bg-[var(--bg-muted)] cursor-pointer"
    >
      <span className="flex items-center py-2 px-4 w-full text-sm text-[var(--text)] rounded-lg">
        <div className="flex items-center w-full gap-2.5">
          <div className="flex items-center justify-center rounded-full bg-[var(--bg-muted)] size-6 shrink-0">
            <FileText size={12} className="text-[var(--accent)]" />
          </div>
          <span className="flex-1 truncate">{note.title || 'Untitled'}</span>
          <span className="text-[10px] text-[var(--text-subtle)] shrink-0">{formatDate(note.updated_at)}</span>
        </div>
      </span>
    </div>
  )
}
