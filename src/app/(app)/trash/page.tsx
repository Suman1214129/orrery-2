'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, RotateCcw, X, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { useNotesStore } from '@/store/notes'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Note } from '@/types'

export default function TrashPage() {
  const { user } = useAuthStore()
  const { loadNotes } = useNotesStore()
  const [deleted, setDeleted] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchDeleted() {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', true)
      .order('updated_at', { ascending: false })
    setDeleted(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchDeleted() }, [user])

  async function restore(id: string) {
    const supabase = createClient()
    await supabase.from('notes').update({ is_deleted: false }).eq('id', id)
    setDeleted((prev) => prev.filter((n) => n.id !== id))
    if (user) loadNotes(user.id)
  }

  async function deletePermanently(id: string) {
    if (!confirm('Permanently delete this note? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', id)
    setDeleted((prev) => prev.filter((n) => n.id !== id))
  }

  async function emptyTrash() {
    if (!user) return
    if (!confirm('Permanently delete all trashed notes? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('notes').delete().eq('user_id', user.id).eq('is_deleted', true)
    setDeleted([])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-[var(--text)]">Trash</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{deleted.length} deleted note{deleted.length !== 1 ? 's' : ''}</p>
        </div>
        {deleted.length > 0 && (
          <Button size="sm" variant="outline" onClick={emptyTrash} className="text-red-500 border-red-200 hover:bg-red-50">
            <Trash2 size={13} /> Empty trash
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[var(--text-subtle)]">Loading…</p>
          </div>
        ) : deleted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Trash2 size={32} className="text-[var(--text-subtle)]" />
            <p className="text-sm text-[var(--text-muted)]">Trash is empty</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {deleted.map((note) => (
              <li key={note.id} className="flex items-center gap-3 py-2.5 px-1 group">
                <FileText size={14} className="text-[var(--text-subtle)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text)] truncate">{note.title || 'Untitled'}</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Deleted {formatDate(note.updated_at)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => restore(note.id)}
                    className="flex items-center justify-center size-7 rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--accent)] transition-colors"
                    title="Restore"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    onClick={() => deletePermanently(note.id)}
                    className="flex items-center justify-center size-7 rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete permanently"
                  >
                    <X size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
