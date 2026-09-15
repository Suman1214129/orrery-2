'use client'
import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Edit3, Plus, X, ChevronRight, MoreHorizontal, Copy, FileText, FolderInput, Trash2, Maximize2, Minimize2, Lock, Unlock, Download, History, CheckSquare, BookOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useNotesStore } from '@/store/notes'
import { useEditorStore } from '@/store/editor'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import dynamic from 'next/dynamic'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { DocPanel } from '@/components/editor/DocPanel'
import { cn, matchesHotkey } from '@/lib/utils'

const CheckpointCanvas = dynamic(() => import('@/components/canvas/CheckpointCanvas').then(m => ({ default: m.CheckpointCanvas })), { ssr: false })
const AISidebar = dynamic(() => import('@/components/editor/AISidebar').then(m => ({ default: m.AISidebar })), { ssr: false })

const MAX_TABS = 8

// ── Doc context menu ──────────────────────────────────────────────────────
interface MenuAction {
  icon: React.ReactNode
  label: string
  shortcut?: string
  danger?: boolean
  divider?: boolean
  onClick: () => void
}

function DocMenu({ actions, onClose }: { actions: MenuAction[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.1 }}
      className="absolute top-full right-0 mt-1 z-50 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden py-1"
    >
      {actions.map((action, i) => (
        <div key={i}>
          {action.divider && i > 0 && <div className="h-px bg-[var(--border)] my-1 mx-2" />}
          <button
            type="button"
            onClick={() => { action.onClick(); onClose() }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors focus:outline-none',
              action.danger
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'text-[var(--text)] hover:bg-[var(--bg-muted)]'
            )}
          >
            <span className="shrink-0 text-[var(--text-subtle)]">{action.icon}</span>
            <span className="flex-1 text-left">{action.label}</span>
            {action.shortcut && <span className="text-[11px] text-[var(--text-subtle)] font-mono">{action.shortcut}</span>}
          </button>
        </div>
      ))}
    </motion.div>
  )
}

// ── Move-to folder modal ──────────────────────────────────────────────────
function MoveToModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { folders, updateNote } = useNotesStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  async function moveTo(folderId: string | null) {
    await updateNote(noteId, { folder_id: folderId })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <motion.div ref={ref} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-72 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text)]">Move to folder</span>
          <button onClick={onClose} className="size-6 flex items-center justify-center rounded text-[var(--text-subtle)] hover:bg-[var(--bg-muted)]"><X size={13} /></button>
        </div>
        <div className="py-1 max-h-64 overflow-y-auto">
          <button onClick={() => moveTo(null)}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors">
            <FolderInput size={14} /> No folder (root)
          </button>
          {folders.map(f => (
            <button key={f.id} onClick={() => moveTo(f.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--bg-muted)] transition-colors">
              <FolderInput size={14} className="text-[var(--text-subtle)]" /> {f.name}
            </button>
          ))}
          {folders.length === 0 && <p className="px-4 py-3 text-xs text-[var(--text-subtle)]">No folders yet.</p>}
        </div>
      </motion.div>
    </div>
  )
}

// ── Version history modal ─────────────────────────────────────────────────
function VersionHistoryModal({ noteId, onClose, onRestore }: { noteId: string; onClose: () => void; onRestore: (content: string) => void }) {
  const { checkpoints } = useEditorStore()
  const noteCheckpoints = checkpoints.filter(c => c.note_id === noteId)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <motion.div ref={ref} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-80 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text)]">Version history</span>
          <button onClick={onClose} className="size-6 flex items-center justify-center rounded text-[var(--text-subtle)] hover:bg-[var(--bg-muted)]"><X size={13} /></button>
        </div>
        <div className="py-1 max-h-72 overflow-y-auto">
          {noteCheckpoints.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <History size={24} className="mx-auto text-[var(--text-subtle)] mb-2" />
              <p className="text-xs text-[var(--text-subtle)]">No checkpoints saved yet.</p>
              <p className="text-xs text-[var(--text-subtle)] mt-1">Use the checkpoint action to save versions.</p>
            </div>
          ) : noteCheckpoints.map((cp, i) => (
            <div key={cp.id} className={cn('flex items-center gap-3 px-4 py-2.5', i !== 0 && 'border-t border-[var(--border-subtle)]')}>
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)] font-medium truncate">{cp.label}</p>
                <p className="text-[10px] text-[var(--text-subtle)]">{new Date(cp.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => { if (confirm(`Restore to "${cp.label}"?`)) { onRestore(cp.content); onClose() } }}
                className="text-xs text-[var(--accent)] hover:underline shrink-0">Restore</button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function EditorPage() {
  const params  = useParams()
  const router  = useRouter()
  const noteId  = params.id as string

  const { notes, createNote, updateNote, deleteNote, duplicateNote, loadNotes } = useNotesStore()
  const { user }    = useAuthStore()
  const hotkeys     = useSettingsStore((s) => s.hotkeys)
  const {
    view, setView, setSidebarMode,
    loadCheckpoints, createCheckpoint, checkpoints,
  } = useEditorStore()

  const note = notes.find((n) => n.id === noteId)
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => [noteId])
  const [menuOpen, setMenuOpen] = useState(false)
  const [showMoveTo, setShowMoveTo] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [fullWidth, setFullWidth] = useState(false)
  const [locked, setLocked] = useState(false)
  const [readingMode, setReadingMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mainSidebarOpen, setMainSidebarOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpenTabIds((prev) => {
      if (prev.includes(noteId)) return prev
      return [...prev, noteId].slice(-MAX_TABS)
    })
  }, [noteId])

  useEffect(() => { if (user && notes.length === 0) loadNotes(user.id) }, [user]) // eslint-disable-line
  useEffect(() => { if (noteId) loadCheckpoints(noteId) }, [noteId, loadCheckpoints])

  useEffect(() => {
    function toggleMainSidebar() { setMainSidebarOpen(v => !v) }
    document.addEventListener('orrery:toggle-main-sidebar', toggleMainSidebar)
    return () => document.removeEventListener('orrery:toggle-main-sidebar', toggleMainSidebar)
  }, [])

  const handleContentChange = useCallback((html: string) => {
    if (locked) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => updateNote(noteId, { content: html }), 800)
  }, [noteId, updateNote, locked])

  async function handleNewTab() {
    if (!user) return
    const n = await createNote(user.id)
    router.push(`/editor/${n.id}`)
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = openTabIds.filter(t => t !== id)
    setOpenTabIds(next)
    if (id === noteId) router.push(next.length > 0 ? `/editor/${next[next.length - 1]}` : '/home')
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (matchesHotkey(e, hotkeys.saveNote)) e.preventDefault()
      if (matchesHotkey(e, hotkeys.toggleCanvas)) { e.preventDefault(); setView(view === 'editor' ? 'canvas' : 'editor') }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkeys, view, setView])

  function exportNote() {
    if (!note) return
    const blob = new Blob([note.content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title || 'untitled'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
  }

  function copyContent() {
    if (!note) return
    const text = note.content.replace(/<[^>]+>/g, '')
    navigator.clipboard.writeText(text)
  }

  async function handleDuplicate() {
    if (!user || !note) return
    const copy = await duplicateNote(noteId, user.id)
    router.push(`/editor/${copy.id}`)
  }

  async function handleTrash() {
    if (!confirm('Move this note to trash?')) return
    await deleteNote(noteId)
    const next = openTabIds.filter(t => t !== noteId)
    router.push(next.length > 0 ? `/editor/${next[next.length - 1]}` : '/home')
  }

  async function addCheckpoint() {
    if (!user || !note) return
    const label = prompt('Checkpoint label:') ?? `Checkpoint ${checkpoints.filter(c => c.note_id === noteId).length + 1}`
    await createCheckpoint(noteId, user.id, label, note.content, undefined)
  }

  function restoreVersion(content: string) {
    updateNote(noteId, { content })
  }

  const menuActions: MenuAction[] = [
    { icon: <Copy size={14} />, label: 'Copy link', onClick: copyLink },
    { icon: <FileText size={14} />, label: 'Copy page content', onClick: copyContent },
    { icon: <FileText size={14} />, label: 'Duplicate', onClick: handleDuplicate, divider: true },
    { icon: <FolderInput size={14} />, label: 'Move to…', onClick: () => setShowMoveTo(true) },
    { icon: <Trash2 size={14} />, label: 'Move to trash', danger: true, onClick: handleTrash, divider: true },
    { icon: fullWidth ? <Minimize2 size={14} /> : <Maximize2 size={14} />, label: fullWidth ? 'Default width' : 'Full width', onClick: () => setFullWidth(v => !v), divider: true },
    { icon: locked ? <Unlock size={14} /> : <Lock size={14} />, label: locked ? 'Unlock page' : 'Lock page', onClick: () => setLocked(v => !v) },
    { icon: <CheckSquare size={14} />, label: 'Save checkpoint', onClick: addCheckpoint, divider: true },
    { icon: <History size={14} />, label: 'Version history', onClick: () => setShowHistory(true) },
    { icon: <Download size={14} />, label: 'Export as HTML', onClick: exportNote },
  ]

  const loading = useNotesStore(s => s.loading)

  if (!note && loading) return <div className="flex items-center justify-center h-full"><div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" /></div>
  if (!note) return <div className="flex items-center justify-center h-full"><p className="text-sm text-[var(--text-muted)]">Note not found.</p></div>

  const tabNotes = openTabIds.map(id => notes.find(n => n.id === id)).filter(Boolean) as typeof notes

  return (
    <TooltipProvider>
      <div className="flex h-full overflow-hidden">

        {/* LEFT panel — collapsible */}
        <AnimatePresence mode="wait" initial={false}>
          {view === 'editor' && !mainSidebarOpen ? (
            <motion.div key="doc-panel"
              initial={{ width: 0, opacity: 0 }} animate={{ width: sidebarCollapsed ? 28 : 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn('shrink-0 overflow-hidden flex flex-col bg-[var(--bg)]', !sidebarCollapsed && 'border-r border-[var(--border)]')}>
              {sidebarCollapsed ? (
                /* Collapsed: just the expand button */
                <div className="flex flex-col items-center pt-2">
                  <Tooltip content="Expand sidebar">
                    <button onClick={() => setSidebarCollapsed(false)}
                      className="flex items-center justify-center size-7 rounded-md text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none">
                      <PanelLeftOpen size={14} />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <>
                  <div className="h-11 flex items-center justify-end px-3 shrink-0 border-b border-[var(--border)] gap-2">
                    <Tooltip content="Collapse sidebar">
                      <button onClick={() => setSidebarCollapsed(true)}
                        className="flex items-center justify-center size-6 rounded text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none shrink-0">
                        <PanelLeftClose size={13} />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <DocPanel noteId={noteId} noteTitle={note.title} noteContent={note.content} noteUpdatedAt={note.updated_at} />
                  </div>
                </>
              )}
            </motion.div>
          ) : view !== 'editor' && !mainSidebarOpen ? (
            <motion.div key="ai-panel"
              initial={{ width: 0, opacity: 0 }} animate={{ width: sidebarCollapsed ? 28 : 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn('shrink-0 overflow-hidden flex flex-col bg-[var(--bg)]', !sidebarCollapsed && 'border-r border-[var(--border)]')}>
              {sidebarCollapsed ? (
                <div className="flex flex-col items-center pt-2">
                  <Tooltip content="Expand sidebar">
                    <button onClick={() => setSidebarCollapsed(false)}
                      className="flex items-center justify-center size-7 rounded-md text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none">
                      <PanelLeftOpen size={14} />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <>
                  <div className="h-11 flex items-center justify-end px-3 shrink-0 border-b border-[var(--border)] gap-2">
                    <Tooltip content="Collapse sidebar">
                      <button onClick={() => setSidebarCollapsed(true)}
                        className="flex items-center justify-center size-6 rounded text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none shrink-0">
                        <PanelLeftClose size={13} />
                      </button>
                    </Tooltip>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AISidebar noteId={noteId} noteContent={note.content} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT: editor area */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Chrome-style tab bar */}
          <div className="bg-[var(--bg)] shrink-0 border-b border-[var(--border)]">
            <div className="flex items-end h-10 px-1">
              <nav className="flex overflow-x-auto flex-1 min-w-0 items-end h-full [&::-webkit-scrollbar]:hidden" role="tablist">
                {tabNotes.map((t) => {
                  const isActive = t.id === noteId
                  return (
                    <button key={t.id} type="button" role="tab" aria-selected={isActive}
                      onClick={() => router.push(`/editor/${t.id}`)}
                      className={cn(
                        'group relative flex items-center gap-1.5 h-[34px] px-3 text-[13px] whitespace-nowrap shrink-0 max-w-[180px] transition-all focus:outline-none select-none',
                        'rounded-t-lg',
                        isActive
                          ? 'bg-[var(--bg)] text-[var(--text)] font-medium shadow-[0_1px_0_var(--bg)] z-10'
                          : 'text-[var(--text-subtle)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-muted)]'
                      )}>
                      <span className="flex-1 truncate min-w-0">{t.title || 'Untitled'}</span>
                      <span
                        role="button" tabIndex={0}
                        onClick={e => closeTab(t.id, e)}
                        className="flex items-center justify-center size-4 rounded-full opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[var(--border)] text-[var(--text-muted)] transition-all shrink-0 ml-0.5">
                        <X size={9} />
                      </span>
                    </button>
                  )
                })}
                <Tooltip content="New note">
                  <button type="button" onClick={handleNewTab}
                    className="flex items-center justify-center h-[34px] w-8 text-[var(--text-subtle)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] rounded-t-lg transition-colors focus:outline-none shrink-0">
                    <Plus size={14} />
                  </button>
                </Tooltip>
              </nav>

              {/* Right controls */}
              <div ref={menuBtnRef} className="flex items-center gap-1 px-2 shrink-0 relative self-center">
                {locked && (
                  <span className="mr-1 text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                )}
                {/* Reading / Editing toggle */}
                <Tooltip content={readingMode ? 'Switch to editing' : 'Switch to reading'}>
                  <button
                    type="button"
                    onClick={() => setReadingMode(v => !v)}
                    className={cn(
                      'flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors focus:outline-none',
                      readingMode
                        ? 'bg-[var(--bg-muted)] text-[var(--text)]'
                        : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
                    )}
                  >
                    {readingMode ? <BookOpen size={13} /> : <Edit3 size={13} />}
                    <span className="hidden sm:inline">{readingMode ? 'Reading' : 'Editing'}</span>
                  </button>
                </Tooltip>
                <Tooltip content="Document options">
                  <button type="button" onClick={() => setMenuOpen(v => !v)}
                    className={cn(
                      'flex items-center justify-center size-7 rounded-md transition-colors focus:outline-none',
                      menuOpen ? 'bg-[var(--bg-muted)] text-[var(--text)]' : 'text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
                    )}>
                    <MoreHorizontal size={15} />
                  </button>
                </Tooltip>
                <AnimatePresence>
                  {menuOpen && <DocMenu actions={menuActions} onClose={() => setMenuOpen(false)} />}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Editor / Canvas */}
          <div className="flex-1 overflow-hidden min-w-0">
            <AnimatePresence mode="wait">
              {view === 'editor' ? (
                <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className={cn('h-full', (locked || readingMode) && 'pointer-events-none select-none', readingMode && 'opacity-100', locked && 'opacity-80')}>
                  <NoteEditor noteId={noteId} content={note.content} onChange={handleContentChange} fullWidth={fullWidth} />
                </motion.div>
              ) : (
                <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                  <CheckpointCanvas noteId={noteId} onNodeClick={() => {}} onForkRequest={() => {}} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom mode switcher */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-full px-2 py-1.5 shadow-[var(--shadow-md)]">
              <button onClick={() => { setView('editor'); setSidebarMode('files') }}
                className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  view === 'editor' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}>
                <Edit3 size={11} /> Editing
              </button>
              <button onClick={() => { setView('canvas'); setSidebarMode('ai') }}
                className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  view === 'canvas' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}>
                <GitBranch size={11} /> Visualization
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showMoveTo && <MoveToModal noteId={noteId} onClose={() => setShowMoveTo(false)} />}
        {showHistory && <VersionHistoryModal noteId={noteId} onClose={() => setShowHistory(false)} onRestore={restoreVersion} />}
      </AnimatePresence>
    </TooltipProvider>
  )
}
