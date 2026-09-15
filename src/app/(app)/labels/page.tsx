'use client'
import { useRouter } from 'next/navigation'
import { Tag, FileText } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { formatDate } from '@/lib/utils'

export default function LabelsPage() {
  const router = useRouter()
  const { notes } = useNotesStore()

  // Build label → notes map
  const labelMap = new Map<string, typeof notes>()
  for (const note of notes) {
    for (const tag of note.tags ?? []) {
      if (!labelMap.has(tag)) labelMap.set(tag, [])
      labelMap.get(tag)!.push(note)
    }
  }
  const labels = Array.from(labelMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  const untagged = notes.filter((n) => !n.tags?.length)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <span className="text-xs text-[var(--text-subtle)]">{labels.length} label{labels.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {labels.length === 0 && untagged.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Tag size={32} className="text-[var(--text-subtle)]" />
            <p className="text-sm text-[var(--text-muted)]">No labels yet</p>
            <p className="text-xs text-[var(--text-subtle)] max-w-xs">Add tags to your notes to organise them by label.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {labels.map(([label, labelNotes]) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={12} className="text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">{label}</span>
                  <span className="text-[10px] text-[var(--text-subtle)]">{labelNotes.length}</span>
                </div>
                <ul className="space-y-0.5 pl-4 border-l border-[var(--border-subtle)]">
                  {labelNotes.map((note) => (
                    <li key={note.id}>
                      <button
                        onClick={() => router.push(`/editor/${note.id}`)}
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
                </ul>
              </div>
            ))}

            {untagged.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={12} className="text-[var(--text-subtle)]" />
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Unlabelled</span>
                  <span className="text-[10px] text-[var(--text-subtle)]">{untagged.length}</span>
                </div>
                <ul className="space-y-0.5 pl-4 border-l border-[var(--border-subtle)]">
                  {untagged.map((note) => (
                    <li key={note.id}>
                      <button
                        onClick={() => router.push(`/editor/${note.id}`)}
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
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
