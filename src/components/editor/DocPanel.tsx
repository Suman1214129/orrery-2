'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Link2, ExternalLink } from 'lucide-react'
import { useEditorStore } from '@/store/editor'
import { cn, formatDate } from '@/lib/utils'

interface Heading { level: number; text: string }

function extractHeadings(html: string): Heading[] {
  if (typeof window === 'undefined') return []
  const div = document.createElement('div')
  div.innerHTML = html
  return Array.from(div.querySelectorAll('h1,h2,h3,h4')).map(el => ({
    level: parseInt(el.tagName[1]),
    text: el.textContent ?? '',
  }))
}

function extractLinks(html: string): { text: string; href: string }[] {
  if (typeof window === 'undefined') return []
  const div = document.createElement('div')
  div.innerHTML = html
  return Array.from(div.querySelectorAll('a[href]')).map(el => ({
    text: el.textContent?.trim() || (el as HTMLAnchorElement).href,
    href: (el as HTMLAnchorElement).href,
  })).filter(l => l.href && !l.href.startsWith('[['))
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'Just Now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return formatDate(iso)
}

type Tab = 'toc' | 'links' | 'checkpoints'

interface Props {
  noteId: string
  noteTitle: string
  noteContent: string
  noteUpdatedAt: string
}

// ── Tab icon SVGs ──────────────────────────────────────────────────────────
function IcTOC({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
    </svg>
  )
}
function IcLink({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}
function IcCheck({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}

export function DocPanel({ noteId, noteTitle, noteContent, noteUpdatedAt }: Props) {
  const [tab, setTab] = useState<Tab>('toc')
  const { checkpoints } = useEditorStore()

  const headings = extractHeadings(noteContent)
  const links = extractLinks(noteContent)
  const noteCheckpoints = checkpoints.filter(c => c.note_id === noteId)

  const TABS: { id: Tab; icon: (a: boolean) => React.ReactNode; label: string }[] = [
    { id: 'toc',         icon: a => <IcTOC active={a} />,   label: 'Contents' },
    { id: 'links',       icon: a => <IcLink active={a} />,  label: 'Links' },
    { id: 'checkpoints', icon: a => <IcCheck active={a} />, label: 'Checkpoints' },
  ]

  return (
    <div className="flex flex-col h-full bg-[var(--bg-subtle)] w-72 shrink-0">

      {/* Note header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center shrink-0 text-base">📄</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate leading-tight">{noteTitle || 'Untitled'}</p>
            <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">{relTime(noteUpdatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Icon tab bar — pill style matching screenshot */}
      <div className="px-3 pb-2 shrink-0">
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-2xl p-1">
          {TABS.map(({ id, icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              title={label}
              aria-label={label}
              className={cn(
                'flex-1 flex items-center justify-center h-8 rounded-xl transition-all focus:outline-none',
                tab === id
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]'
                  : 'text-[var(--text-subtle)] hover:text-[var(--text-muted)]'
              )}
            >
              {icon(tab === id)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* TOC */}
          {tab === 'toc' && (
            <motion.div key="toc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="h-full overflow-y-auto px-3 pb-4">
              {headings.length === 0 ? (
                <div className="pt-8 text-center px-4">
                  <p className="text-xs text-[var(--text-subtle)] font-medium">Table of Contents</p>
                  <p className="text-xs text-[var(--text-subtle)] mt-2">Add headings to your note to see them here.</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-[var(--text-subtle)] mb-2 font-medium uppercase tracking-wider px-1">Table of Contents</p>
                  <ul className="space-y-0.5">
                    {headings.map((h, i) => (
                      <li key={i}>
                        <button type="button" className={cn(
                          'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors focus:outline-none hover:bg-[var(--bg-muted)]',
                          h.level === 1 && 'font-semibold text-[var(--text)]',
                          h.level === 2 && 'pl-4 text-[var(--text-muted)]',
                          h.level === 3 && 'pl-6 text-xs text-[var(--text-muted)]',
                          h.level === 4 && 'pl-8 text-xs text-[var(--text-subtle)]',
                        )}>
                          {h.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          )}

          {/* Links */}
          {tab === 'links' && (
            <motion.div key="links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="h-full overflow-y-auto px-3 pb-4">
              {links.length === 0 ? (
                <div className="pt-8 text-center px-4">
                  <Link2 size={24} className="mx-auto text-[var(--text-subtle)] mb-2" />
                  <p className="text-xs text-[var(--text-subtle)]">No links in this note yet.</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-[var(--text-subtle)] mb-2 font-medium uppercase tracking-wider px-1">Links ({links.length})</p>
                  <ul className="space-y-1">
                    {links.map((l, i) => (
                      <li key={i}>
                        <a href={l.href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors group">
                          <ExternalLink size={12} className="text-[var(--text-subtle)] shrink-0" />
                          <span className="flex-1 text-xs text-[var(--accent)] truncate group-hover:underline">{l.text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          )}

          {/* Checkpoints */}
          {tab === 'checkpoints' && (
            <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="h-full overflow-y-auto px-3 pb-4">
              {noteCheckpoints.length === 0 ? (
                <div className="pt-8 text-center px-4">
                  <CheckSquare size={24} className="mx-auto text-[var(--text-subtle)] mb-2" />
                  <p className="text-xs text-[var(--text-subtle)]">No checkpoints yet.</p>
                  <p className="text-xs text-[var(--text-subtle)] mt-1">Use the checkpoint button in the tab bar to save a version.</p>
                </div>
              ) : (
                <ul className="space-y-1.5 pt-1">
                  {noteCheckpoints.map((cp) => (
                    <li key={cp.id} className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--bg-muted)] transition-colors">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--text)] font-medium truncate">{cp.label}</p>
                        <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">{formatDate(cp.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
