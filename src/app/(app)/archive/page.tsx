'use client'
import { Archive } from 'lucide-react'

export default function ArchivePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <h1 className="text-sm font-semibold text-[var(--text)]">Archive</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Archived notes</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <Archive size={32} className="text-[var(--text-subtle)]" />
        <p className="text-sm text-[var(--text-muted)]">No archived notes</p>
        <p className="text-xs text-[var(--text-subtle)] max-w-xs">
          Notes you archive will appear here. Use the note menu to archive a note.
        </p>
      </div>
    </div>
  )
}
