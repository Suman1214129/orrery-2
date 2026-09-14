'use client'
import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeftOpen, GitBranch, Eye, Edit3, Sparkles,
  CheckSquare, ChevronLeft,
} from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useEditorStore } from '@/store/editor'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { CheckpointCanvas } from '@/components/canvas/CheckpointCanvas'
import { AISidebar } from '@/components/editor/AISidebar'
import { matchesHotkey } from '@/lib/utils'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const { notes, sidebarOpen, setSidebarOpen, updateNote, loadNotes } = useNotesStore()
  const { user } = useAuthStore()
  const hotkeys = useSettingsStore((s) => s.hotkeys)
  const {
    view, sidebarMode, setView, setSidebarMode,
    loadCheckpoints, createCheckpoint, selectedCheckpointId, checkpoints,
  } = useEditorStore()

  const note = notes.find((n) => n.id === noteId)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [title, setTitle] = useState(note?.title ?? '')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If notes haven't loaded yet (direct URL navigation), load them
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

  // Hotkeys
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (matchesHotkey(e, hotkeys.saveNote)) { e.preventDefault(); /* auto-saved */ }
      if (matchesHotkey(e, hotkeys.toggleSidebar)) { e.preventDefault(); setSidebarOpen(!sidebarOpen) }
      if (matchesHotkey(e, hotkeys.toggleCanvas)) { e.preventDefault(); setView(view === 'editor' ? 'canvas' : 'editor') }
      if (matchesHotkey(e, hotkeys.forkBranch)) { e.preventDefault(); if (selectedCheckpointId) setAiPanelOpen(true) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkeys, sidebarOpen, view, selectedCheckpointId, setSidebarOpen, setView])

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

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] flex-shrink-0">
          {!sidebarOpen && (
            <Tooltip content="Open sidebar">
              <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(true)}>
                <PanelLeftOpen size={15} />
              </Button>
            </Tooltip>
          )}

          <Tooltip content="Back to home">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/home')}>
              <ChevronLeft size={15} />
            </Button>
          </Tooltip>

          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="flex-1 bg-transparent text-sm font-semibold text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none min-w-0"
          />

          <div className="flex items-center gap-1 ml-auto">
            {/* View toggle */}
            <div className="flex items-center rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
              <Tooltip content={`Editor (${hotkeys.toggleCanvas})`}>
                <button
                  onClick={() => setView('editor')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
                    view === 'editor'
                      ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Edit3 size={12} /> Editor
                </button>
              </Tooltip>
              <div className="w-px h-4 bg-[var(--border)]" />
              <Tooltip content={`Canvas (${hotkeys.toggleCanvas})`}>
                <button
                  onClick={() => setView('canvas')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors ${
                    view === 'canvas'
                      ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Eye size={12} /> Canvas
                </button>
              </Tooltip>
            </div>

            {view === 'editor' && (
              <Tooltip content="Add checkpoint">
                <Button variant="ghost" size="icon-sm" onClick={addCheckpoint}>
                  <CheckSquare size={14} />
                </Button>
              </Tooltip>
            )}

            <Tooltip content={aiPanelOpen ? 'Close AI panel' : 'Open AI panel'}>
              <Button
                variant={aiPanelOpen ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
              >
                <Sparkles size={14} />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              {view === 'editor' ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <NoteEditor
                    noteId={noteId}
                    content={note.content}
                    onChange={handleContentChange}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <CheckpointCanvas
                    noteId={noteId}
                    onNodeClick={(cpId) => {
                      // scroll editor to checkpoint position if switching back
                    }}
                    onForkRequest={(cpId) => {
                      setAiPanelOpen(true)
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Panel */}
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

        {/* Bottom floating chip — view switcher (Craft/Sudowrite style) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-full px-2 py-1.5 shadow-[var(--shadow-md)]"
          >
            <button
              onClick={() => { setView('editor'); setSidebarMode('files') }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'editor' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Edit3 size={11} /> Editing
            </button>
            <button
              onClick={() => { setView('canvas'); setSidebarMode('ai'); setAiPanelOpen(true) }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'canvas' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <GitBranch size={11} /> Visualization
            </button>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  )
}
