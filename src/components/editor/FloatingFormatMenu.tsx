'use client'
import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'

interface Props { editor: Editor }
interface Pos { top: number; left: number }

// ── Tiny icon helpers ──────────────────────────────────────────────────────
const Ic = ({ d, vb = '0 0 20 20' }: { d: string | string[]; vb?: string }) => (
  <svg viewBox={vb} style={{ width: 15, height: 15, fill: 'currentColor', display: 'block', flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
)

// ── Styles ─────────────────────────────────────────────────────────────────
const menuStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 200,
  maxWidth: 240,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  flexWrap: 'wrap',
}

const divStyle: React.CSSProperties = {
  height: 1,
  background: 'var(--border)',
  margin: '3px 4px',
}

function Btn({
  label, active, onClick, children, wide,
}: {
  label: string; active?: boolean; onClick: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: wide ? 'flex-start' : 'center',
        gap: 6,
        height: 28,
        minWidth: wide ? '100%' : 30,
        padding: wide ? '0 8px' : '0 6px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        background: active ? 'var(--accent-light)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text)',
        transition: 'background 80ms',
        whiteSpace: 'nowrap',
      }}
      className="hover:bg-[var(--bg-muted)]"
    >
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 2px' }}>
      {children}
    </p>
  )
}

// ── Link dialog ────────────────────────────────────────────────────────────
function LinkInput({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState(editor.getAttributes('link').href ?? '')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  function apply() {
    if (url) editor.chain().focus().setLink({ href: url }).run()
    else editor.chain().focus().unsetLink().run()
    onClose()
  }
  return (
    <div style={{ padding: '4px 4px 2px', display: 'flex', gap: 4 }}>
      <input
        ref={ref}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') apply(); if (e.key === 'Escape') onClose() }}
        placeholder="https://…"
        style={{
          flex: 1, height: 28, padding: '0 8px', fontSize: 12,
          border: '1px solid var(--border)', borderRadius: 6,
          background: 'var(--bg-muted)', color: 'var(--text)', outline: 'none',
        }}
      />
      <button
        onMouseDown={e => { e.preventDefault(); apply() }}
        style={{ height: 28, padding: '0 10px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
      >
        Apply
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function FloatingFormatMenu({ editor }: Props) {
  const [pos,       setPos]       = useState<Pos | null>(null)
  const [linkMode,  setLinkMode]  = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      const { empty } = editor.state.selection
      if (empty) { setPos(null); setLinkMode(false); return }
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) { setPos(null); return }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (!rect.width) { setPos(null); return }

      const mH = menuRef.current?.offsetHeight ?? 320
      const mW = menuRef.current?.offsetWidth  ?? 220
      let top  = rect.top  - mH - 10
      let left = rect.left + rect.width / 2 - mW / 2
      if (top < 8) top = rect.bottom + 10
      left = Math.max(8, Math.min(left, window.innerWidth - mW - 8))
      setPos({ top, left })
    }
    editor.on('selectionUpdate', update)
    editor.on('blur', () => { setPos(null); setLinkMode(false) })
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('blur', () => {})
    }
  }, [editor])

  if (!pos) return null

  const e = editor
  const isH = (l: 1|2|3|4) => e.isActive('heading', { level: l })

  return (
    <div
      ref={menuRef}
      onMouseDown={ev => ev.preventDefault()}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, pointerEvents: 'auto' }}
    >
      <div style={menuStyle}>

        {/* ── Inline marks ── */}
        <SectionLabel>Format</SectionLabel>
        <div style={rowStyle}>
          <Btn label="Bold"          active={e.isActive('bold')}   onClick={() => e.chain().focus().toggleBold().run()}>
            <strong style={{ fontSize: 13 }}>B</strong>
          </Btn>
          <Btn label="Italic"        active={e.isActive('italic')} onClick={() => e.chain().focus().toggleItalic().run()}>
            <em style={{ fontSize: 13 }}>I</em>
          </Btn>
          <Btn label="Strikethrough" active={e.isActive('strike')} onClick={() => e.chain().focus().toggleStrike().run()}>
            <s style={{ fontSize: 12 }}>S</s>
          </Btn>
          <Btn label="Inline code"   active={e.isActive('code')}   onClick={() => e.chain().focus().toggleCode().run()}>
            <Ic d="M11.971 3.1c.332.094.525.44.43.772l-3.6 12.6a.625.625 0 0 1-1.202-.343l3.6-12.6a.625.625 0 0 1 .772-.43M5.417 5.598a.626.626 0 0 1 .885.884L2.784 10l3.518 3.519a.625.625 0 0 1-.885.883l-3.96-3.96a.626.626 0 0 1 0-.884zm8.281 0a.626.626 0 0 1 .884 0l3.96 3.96a.626.626 0 0 1 0 .884l-3.96 3.96a.626.626 0 0 1-.884-.883L17.215 10l-3.517-3.518a.626.626 0 0 1 0-.884" />
          </Btn>
          <Btn label="Clear format"  active={false}                onClick={() => e.chain().focus().unsetAllMarks().run()}>
            <Ic d={['M12.75 4.2c.345 0 .625.28.625.625v1.8a.625.625 0 0 1-1.25 0V5.45h-3.25v9.1h.726a.626.626 0 0 1 0 1.25H6.9a.625.625 0 1 1 0-1.25h.724v-9.1h-3.25v1.175a.625.625 0 0 1-1.25 0v-1.8c0-.345.28-.625.625-.625z', 'M16.176 9.558a.626.626 0 0 1 .884.884l-1.68 1.68 1.68 1.679a.625.625 0 0 1-.884.884l-1.68-1.68-1.679 1.68a.626.626 0 0 1-.884-.884l1.678-1.68-1.678-1.679a.626.626 0 0 1 .884-.884l1.68 1.678z']} />
          </Btn>
        </div>

        <div style={divStyle} />

        {/* ── Headings ── */}
        <SectionLabel>Headings</SectionLabel>
        <div style={rowStyle}>
          {([1,2,3,4] as const).map(l => (
            <Btn key={l} label={`Heading ${l}`} active={isH(l)} onClick={() => e.chain().focus().toggleHeading({ level: l }).run()}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>H{l}</span>
            </Btn>
          ))}
        </div>

        <div style={divStyle} />

        {/* ── Blocks ── */}
        <SectionLabel>Blocks</SectionLabel>
        <Btn label="Bullet list"   wide active={e.isActive('bulletList')}  onClick={() => e.chain().focus().toggleBulletList().run()}>
          <Ic d="M4 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3-1.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM4 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3-1.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM4 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3-1.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z" vb="0 0 20 20" />
          Bullet list
        </Btn>
        <Btn label="Numbered list" wide active={e.isActive('orderedList')} onClick={() => e.chain().focus().toggleOrderedList().run()}>
          <Ic d="M3.5 4.5a.5.5 0 0 1 .5-.5h.5V3h-.5A1.5 1.5 0 0 0 2.5 4.5v.25h1zm0 .25H2.5V6h1zm3-1a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zM2.5 9.5h1v1h-1zm0 1h1v.5a.5.5 0 0 1-.5.5H2.5zm1-2H2.5v.5a.5.5 0 0 0 .5.5h.5zm-1 6h1v1h-1zm1 1h-1v.5a.5.5 0 0 0 .5.5h.5zm-1-2h1v.5a.5.5 0 0 1-.5.5H2.5z" vb="0 0 20 20" />
          Numbered list
        </Btn>
        <Btn label="To-do list"    wide active={e.isActive('taskList')}    onClick={() => e.chain().focus().toggleTaskList().run()}>
          <Ic d="M7.5 4a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5zm-2 .5A2 2 0 0 1 7.5 2.5h9A2 2 0 0 1 18.5 4.5v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM5 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" vb="0 0 20 20" />
          To-do list
        </Btn>
        <Btn label="Blockquote"    wide active={e.isActive('blockquote')}  onClick={() => e.chain().focus().toggleBlockquote().run()}>
          <Ic d="M6 5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1.5l-1 3H8l1.5-4.5V6a1 1 0 0 0-1-1zm7 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1.5l-1 3H15l1.5-4.5V6a1 1 0 0 0-1-1z" vb="0 0 20 20" />
          Quote
        </Btn>
        <Btn label="Code block"    wide active={e.isActive('codeBlock')}   onClick={() => e.chain().focus().toggleCodeBlock().run()}>
          <Ic d="M11.971 3.1c.332.094.525.44.43.772l-3.6 12.6a.625.625 0 0 1-1.202-.343l3.6-12.6a.625.625 0 0 1 .772-.43M5.417 5.598a.626.626 0 0 1 .885.884L2.784 10l3.518 3.519a.625.625 0 0 1-.885.883l-3.96-3.96a.626.626 0 0 1 0-.884zm8.281 0a.626.626 0 0 1 .884 0l3.96 3.96a.626.626 0 0 1 0 .884l-3.96 3.96a.626.626 0 0 1-.884-.883L17.215 10l-3.517-3.518a.626.626 0 0 1 0-.884" />
          Code block
        </Btn>
        <Btn label="Insert table"  wide active={false}                     onClick={() => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Ic d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm2 1v3h4V5zm0 4v3h4V9zm0 4v3h4v-3zm5-8v3h5V5zm0 4v3h5V9zm0 4v3h5v-3z" vb="0 0 20 20" />
          Table
        </Btn>

        <div style={divStyle} />

        {/* ── Link ── */}
        <SectionLabel>Link</SectionLabel>
        {linkMode ? (
          <LinkInput editor={editor} onClose={() => setLinkMode(false)} />
        ) : (
          <Btn label="Link" wide active={e.isActive('link')} onClick={() => setLinkMode(true)}>
            <Ic d={['M10.61 3.61a3.776 3.776 0 0 1 5.34 0l.367.368a3.776 3.776 0 0 1 0 5.34l-1.852 1.853a.625.625 0 1 1-.884-.884l1.853-1.853a2.526 2.526 0 0 0 0-3.572l-.368-.367a2.526 2.526 0 0 0-3.572 0L9.641 6.347a.625.625 0 1 1-.883-.883z', 'M12.98 6.949a.625.625 0 0 1 0 .884L7.53 13.28a.625.625 0 0 1-.884-.884l5.448-5.448a.625.625 0 0 1 .884 0', 'M6.348 8.757a.625.625 0 0 1 0 .884l-1.853 1.853a2.526 2.526 0 0 0 0 3.572l.367.367a2.525 2.525 0 0 0 3.572 0l1.853-1.852a.625.625 0 1 1 .884.883l-1.853 1.853a3.776 3.776 0 0 1-5.34 0l-.367-.367a3.776 3.776 0 0 1 0-5.34l1.853-1.853a.625.625 0 0 1 .884 0']} vb="2.5 0 14.92 20" />
            {e.isActive('link') ? 'Edit link' : 'Add link'}
          </Btn>
        )}
        {e.isActive('link') && !linkMode && (
          <Btn label="Remove link" wide active={false} onClick={() => e.chain().focus().unsetLink().run()}>
            <Ic d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" vb="0 0 20 20" />
            Remove link
          </Btn>
        )}

      </div>
    </div>
  )
}
