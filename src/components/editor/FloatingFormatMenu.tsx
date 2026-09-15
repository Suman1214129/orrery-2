'use client'
import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'

interface Props { editor: Editor }

interface Rect { top: number; left: number }

// Inline SVG icons matching Notion's exact paths from the reference
function IconBold() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M6.428 3.95a.875.875 0 0 0-.875.875v10.35c0 .483.392.875.875.875h3.81c1.377 0 2.461-.298 3.203-.963.763-.682 1.006-1.607 1.006-2.5 0-1.199-.582-2.18-1.483-2.788.704-.64 1.007-1.494 1.007-2.386 0-2.145-2.08-3.463-4.086-3.463zm.875 6.925h3.359c1.303 0 2.035.805 2.035 1.713 0 .586-.153.954-.423 1.196-.29.26-.873.516-2.036.516H7.303zm2.165-1.75H7.303V5.7h2.582c1.452 0 2.336.9 2.336 1.713 0 .515-.172.89-.516 1.16-.373.294-1.057.55-2.237.552" />
    </svg>
  )
}
function IconItalic() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="m10.541 5.45-2.374 9.1H6.4a.625.625 0 1 0 0 1.25h4.5a.625.625 0 1 0 0-1.25H9.46l2.374-9.1H13.6a.625.625 0 1 0 0-1.25H9.1a.625.625 0 1 0 0 1.25z" />
    </svg>
  )
}
function IconUnderline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M15.4 5.45a.625.625 0 1 0 0-1.25h-2.7a.625.625 0 0 0 0 1.25h.725v5.54c0 1.743-1.434 3.335-3.425 3.335-1.235 0-2.07-.414-2.602-.996-.541-.594-.823-1.423-.823-2.339V5.45H7.3a.625.625 0 1 0 0-1.25H4.6a.625.625 0 1 0 0 1.25h.725v5.54c0 1.163.358 2.314 1.15 3.181.8.877 1.989 1.404 3.525 1.404 2.699 0 4.675-2.17 4.675-4.585V5.45zm1.525 12.2c0 .345-.28.625-.625.625H3.7a.625.625 0 1 1 0-1.25h12.6c.345 0 .625.28.625.625" />
    </svg>
  )
}
function IconStrike() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M10.065 9.373H16.3a.627.627 0 1 1 0 1.255h-3.233l.122.107c.723.665 1.038 1.505 1.038 2.456 0 1.024-.503 1.868-1.288 2.436-.772.56-1.81.85-2.939.85s-2.167-.29-2.94-.85c-.784-.568-1.288-1.412-1.288-2.436a.628.628 0 0 1 1.255 0c0 .571.268 1.057.77 1.42.513.37 1.276.611 2.203.611.928 0 1.69-.24 2.204-.612.5-.362.768-.848.768-1.42 0-.644-.199-1.133-.632-1.531-.452-.416-1.207-.777-2.405-1.032H3.7a.627.627 0 1 1 0-1.255h3.233l-.122-.107C6.088 8.6 5.773 7.76 5.773 6.81c0-1.024.503-1.868 1.288-2.436.772-.56 1.81-.85 2.94-.85s2.166.29 2.938.85c.785.568 1.289 1.412 1.289 2.436a.628.628 0 0 1-1.255 0c0-.571-.268-1.057-.77-1.42-.513-.37-1.275-.612-2.203-.612s-1.69.241-2.203.613c-.502.362-.77.848-.77 1.42 0 .644.2 1.133.633 1.531.452.416 1.207.777 2.405 1.032" />
    </svg>
  )
}
function IconCode() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M11.971 3.1c.332.094.525.44.43.772l-3.6 12.6a.625.625 0 0 1-1.202-.343l3.6-12.6a.625.625 0 0 1 .772-.43M5.417 5.598a.626.626 0 0 1 .885.884L2.784 10l3.518 3.519a.625.625 0 0 1-.885.883l-3.96-3.96a.626.626 0 0 1 0-.884zm8.281 0a.626.626 0 0 1 .884 0l3.96 3.96a.626.626 0 0 1 0 .884l-3.96 3.96a.626.626 0 0 1-.884-.883L17.215 10l-3.517-3.518a.626.626 0 0 1 0-.884" />
    </svg>
  )
}
function IconLink() {
  return (
    <svg aria-hidden="true" viewBox="2.5 0 14.92 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M10.61 3.61a3.776 3.776 0 0 1 5.34 0l.367.368a3.776 3.776 0 0 1 0 5.34l-1.852 1.853a.625.625 0 1 1-.884-.884l1.853-1.853a2.526 2.526 0 0 0 0-3.572l-.368-.367a2.526 2.526 0 0 0-3.572 0L9.641 6.347a.625.625 0 1 1-.883-.883z" />
      <path d="M12.98 6.949a.625.625 0 0 1 0 .884L7.53 13.28a.625.625 0 0 1-.884-.884l5.448-5.448a.625.625 0 0 1 .884 0" />
      <path d="M6.348 8.757a.625.625 0 0 1 0 .884l-1.853 1.853a2.526 2.526 0 0 0 0 3.572l.367.367a2.525 2.525 0 0 0 3.572 0l1.853-1.852a.625.625 0 1 1 .884.883l-1.853 1.853a3.776 3.776 0 0 1-5.34 0l-.367-.367a3.776 3.776 0 0 1 0-5.34l1.853-1.853a.625.625 0 0 1 .884 0" />
    </svg>
  )
}
function IconClearFormat() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" style={{ width: '100%', height: '100%', display: 'block', fill: 'currentColor', flexShrink: 0 }}>
      <path d="M12.75 4.2c.345 0 .625.28.625.625v1.8a.625.625 0 0 1-1.25 0V5.45h-3.25v9.1h.726a.626.626 0 0 1 0 1.25H6.9a.625.625 0 1 1 0-1.25h.724v-9.1h-3.25v1.175a.625.625 0 0 1-1.25 0v-1.8c0-.345.28-.625.625-.625z" />
      <path d="M16.176 9.558a.626.626 0 0 1 .884.884l-1.68 1.68 1.68 1.679a.625.625 0 0 1-.884.884l-1.68-1.68-1.679 1.68a.626.626 0 0 1-.884-.884l1.678-1.68-1.678-1.679a.626.626 0 0 1 .884-.884l1.68 1.678z" />
    </svg>
  )
}

const DIVIDER = 'divider'

type ActionItem = {
  label: string
  icon: React.ReactNode
  active: (e: Editor) => boolean
  run: (e: Editor) => void
  pressed?: boolean
} | typeof DIVIDER

function getActions(editor: Editor): ActionItem[] {
  return [
    {
      label: 'Bold',
      icon: <IconBold />,
      active: (e) => e.isActive('bold'),
      run: (e) => e.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: <IconItalic />,
      active: (e) => e.isActive('italic'),
      run: (e) => e.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Underline',
      icon: <IconUnderline />,
      active: () => false,
      run: () => {},
    },
    {
      label: 'Strikethrough',
      icon: <IconStrike />,
      active: (e) => e.isActive('strike'),
      run: (e) => e.chain().focus().toggleStrike().run(),
    },
    {
      label: 'Inline code',
      icon: <IconCode />,
      active: (e) => e.isActive('code'),
      run: (e) => e.chain().focus().toggleCode().run(),
    },
    DIVIDER,
    {
      label: 'Link',
      icon: <IconLink />,
      active: (e) => e.isActive('link'),
      run: (e) => {
        const url = prompt('URL:')
        if (url) e.chain().focus().setLink({ href: url }).run()
      },
    },
    {
      label: 'Clear format',
      icon: <IconClearFormat />,
      active: () => false,
      run: (e) => e.chain().focus().unsetAllMarks().run(),
    },
  ]
}

export function FloatingFormatMenu({ editor }: Props) {
  const [pos, setPos] = useState<Rect | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      const { from, to, empty } = editor.state.selection
      if (empty) { setPos(null); return }

      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) { setPos(null); return }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (!rect.width) { setPos(null); return }

      const menuH = 44
      const menuW = menuRef.current?.offsetWidth ?? 260
      let top = rect.top + window.scrollY - menuH - 8
      let left = rect.left + window.scrollX + rect.width / 2 - menuW / 2

      // Keep within viewport
      if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 8
      left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8))

      setPos({ top, left })
    }

    editor.on('selectionUpdate', update)
    editor.on('blur', () => setPos(null))
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('blur', () => setPos(null))
    }
  }, [editor])

  if (!pos) return null

  const actions = getActions(editor)

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        pointerEvents: 'auto',
        transformOrigin: 'center bottom',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          background: 'var(--surface)',
          overflow: 'hidden',
          fontSize: 14,
          lineHeight: 1.2,
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.10)',
          border: '1px solid var(--border)',
          pointerEvents: 'auto',
          padding: 8,
          minWidth: 220,
        }}
      >
        {/* Formatting row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {actions.map((action, i) => {
            if (action === DIVIDER) {
              return (
                <div
                  key={`div-${i}`}
                  style={{ width: 1, height: 20, background: 'var(--border)', marginInline: 2 }}
                />
              )
            }
            const isActive = action.active(editor)
            return (
              <button
                key={action.label}
                type="button"
                aria-label={action.label}
                aria-pressed={isActive}
                onMouseDown={(e) => { e.preventDefault(); action.run(editor) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  height: 28,
                  width: 32,
                  padding: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-light)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text)',
                  fill: isActive ? 'var(--accent)' : 'var(--text)',
                  transition: 'background 100ms',
                }}
                className="hover:bg-[var(--bg-muted)]"
              >
                <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {action.icon}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
