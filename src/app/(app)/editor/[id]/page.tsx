'use client'
import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, Eye, Edit3, Sparkles,
  CheckSquare, Plus, X,
} from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useEditorStore } from '@/store/editor'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import dynamic from 'next/dynamic'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { cn, matchesHotkey } from '@/lib/utils'
const CheckpointCanvas = dynamic(() => import('@/components/canvas/CheckpointCanvas').then(m => ({ default: m.CheckpointCanvas })), { ssr: false })
const AISidebar = dynamic(() => import('@/components/editor/AISidebar').then(m => ({ default: m.AISidebar })), { ssr: false })

// Max tabs shown before scrolling
const MAX_TABS = 8

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const { notes, createNote, setSidebarOpen, updateNote, loadNotes } = useNotesStore()
  const { user } = useAuthStore()
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const {
    view, sidebarMode, setView, setSidebarMode,
    loadCheckpoints, createCheckpoint, selectedCheckpointId, checkpoints,
  } = useEditorStore()

  const note = notes.find((n) => n.id === noteId)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [title, setTitle] = useState(note?.title ?? '')
  // openTabIds: ordered list of note IDs open as tabs
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => [noteId])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep current note in tabs
  useEffect(() => {
    setOpenTabIds((prev) => {
      if (prev.includes(noteId)) return prev
      const next = [...prev, noteId]
      return next.slice(-MAX_TABS)
    })
  }, [noteId])

  useEffect(() => {
    if (user && notes.length === 0) loadNotes(user.id)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (noteId) loadCheckpoints(noteId)
  }, [noteId, loadCheckpoints])

  useEffect(() => {
    if (note) setTitle(note.title)
  }, [note?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentChange = useCallback(
    (html: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateNote(noteId, { content: html })
      }, 800)
    },
    [noteId, updateNote]
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateNote(noteId, { title: e.target.value })
      }, 600)
    },
    [noteId, updateNote]
  )

  async function addCheckpoint() {
    if (!user || !note) return
    const label = prompt('Checkpoint label (optional):') ?? `Checkpoint ${(checkpoints.filter(c => c.note_id === noteId).length) + 1}`
    await createCheckpoint(noteId, user.id, label, note.content, undefined)
  }

  async function handleNewTab() {
    if (!user) return
    const newNote = await createNote(user.id)
    router.push(`/editor/${newNote.id}`)
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = openTabIds.filter((t) => t !== id)
    setOpenTabIds(next)
    if (id === noteId) {
      if (next.length > 0) router.push(`/editor/${next[next.length - 1]}`)
      else router.push('/home')
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (matchesHotkey(e, hotkeys.saveNote)) { e.preventDefault() }
      if (matchesHotkey(e, hotkeys.toggleCanvas)) { e.preventDefault(); setView(view === 'editor' ? 'canvas' : 'editor') }
      if (matchesHotkey(e, hotkeys.forkBranch)) { e.preventDefault(); if (selectedCheckpointId) setAiPanelOpen(true) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkeys, view, selectedCheckpointId, setView])

  const loading = useNotesStore((s) => s.loading)

  if (!note && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[var(--text-muted)]">Note not found.</p>
      </div>
    )
  }

  const tabNotes = openTabIds.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as typeof notes

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Tab bar ── */}
        <div className="border-b border-[var(--border)] bg-[var(--bg)] flex-shrink-0">
          <div className="flex items-stretch h-10">
            <nav
              className="flex overflow-x-auto flex-1 min-w-0 [&::-webkit-scrollbar]:hidden"
              aria-label="Open notes"
              role="tablist"
            >
              {tabNotes.map((t) => {
                const isActive = t.id === noteId
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => router.push(`/editor/${t.id}`)}
                    className={cn(
                      'group relative flex items-center gap-1.5 h-full px-3 text-sm whitespace-nowrap',
                      'after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-transparent',
                      'focus:outline-none transition-colors',
                      isActive
                        ? 'text-[var(--text)] font-medium after:bg-[var(--accent)]'
                        : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)]'
                    )}
                  >
                    <span className="max-w-[140px] truncate">{t.title || 'Untitled'}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => closeTab(t.id, e)}
                      onKeyDown={(e) => e.key === 'Enter' && closeTab(t.id, e as unknown as React.MouseEvent)}
                      className="flex items-center justify-center size-4 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[var(--bg-muted)] text-[var(--text-muted)] transition-opacity"
                    >
                      <X size={10} />
                    </span>
                  </button>
                )
              })}
              {/* Inline + new tab button */}
              <Tooltip content="New note">
                <button
                  type="button"
                  onClick={handleNewTab}
                  className="flex items-center justify-center h-full px-2.5 text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors focus:outline-none"
                  aria-label="New note"
                >
                  <Plus size={14} />
                </button>
              </Tooltip>
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1 px-2 shrink-0">
              {view === 'editor' && (
                <Tooltip content="Add checkpoint">
                  <button type="button" onClick={addCheckpoint} className="flex items-center justify-center size-7 rounded-md text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none">
                    <CheckSquare size={14} />
                  </button>
                </Tooltip>
              )}
              <Tooltip content={aiPanelOpen ? 'Close AI panel' : 'Open AI panel'}>
                <button
                  type="button"
                  onClick={() => setAiPanelOpen(!aiPanelOpen)}
                  className={cn(
                    'flex items-center justify-center size-7 rounded-md transition-colors focus:outline-none',
                    aiPanelOpen ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
                  )}
                >
                  <Sparkles size={14} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              {view === 'editor' ? (
                <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                  <NoteEditor noteId={noteId} content={note.content} onChange={handleContentChange} />
                </motion.div>
              ) : (
                <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                  <CheckpointCanvas
                    noteId={noteId}
                    onNodeClick={() => {}}
                    onForkRequest={() => setAiPanelOpen(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {aiPanelOpen && (
              <motion.div
                key="ai-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 overflow-hidden"
              >
                <AISidebar noteId={noteId} noteContent={note.content} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom floating chip */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-full px-2 py-1.5 shadow-[var(--shadow-md)]"
          >
            <button
              onClick={() => { setView('editor'); setSidebarMode('files') }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                view === 'editor' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              <Edit3 size={11} /> Editing
            </button>
            <button
              onClick={() => { setView('canvas'); setSidebarMode('ai'); setAiPanelOpen(true) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                view === 'canvas' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              <GitBranch size={11} /> Visualization
            </button>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  )
}
