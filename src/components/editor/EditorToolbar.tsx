'use client'
import type { Editor } from '@tiptap/react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Separator from '@radix-ui/react-separator'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, Link2, Table,
  Code2, Image as ImageIcon,
} from 'lucide-react'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface Props { editor: Editor }

export function EditorToolbar({ editor }: Props) {
  function addLink() {
    const url = prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  function addImage() {
    const url = prompt('Image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  function addTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const btn = (label: string, active: boolean, onClick: () => void, icon: React.ReactNode) => (
    <Tooltip content={label} key={label}>
      <button
        onMouseDown={(e) => { e.preventDefault(); onClick() }}
        className={cn(
          'h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors text-[var(--text-muted)]',
          active
            ? 'bg-[var(--accent-light)] text-[var(--accent)]'
            : 'hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
        )}
      >
        {icon}
      </button>
    </Tooltip>
  )

  const sep = () => (
    <Separator.Root
      orientation="vertical"
      className="w-px h-4 bg-[var(--border)] mx-0.5"
    />
  )

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-[var(--border)] bg-[var(--surface)] flex-wrap">
        {btn('Heading 1', editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 size={14} />)}
        {btn('Heading 2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={14} />)}
        {btn('Heading 3', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 size={14} />)}
        {sep()}
        {btn('Bold', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={14} />)}
        {btn('Italic', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={14} />)}
        {btn('Strikethrough', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), <Strikethrough size={14} />)}
        {btn('Inline code', editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), <Code size={14} />)}
        {sep()}
        {btn('Bullet list', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List size={14} />)}
        {btn('Numbered list', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={14} />)}
        {btn('Task list', editor.isActive('taskList'), () => editor.chain().focus().toggleTaskList().run(), <CheckSquare size={14} />)}
        {sep()}
        {btn('Blockquote', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <Quote size={14} />)}
        {btn('Code block', editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <Code2 size={14} />)}
        {btn('Horizontal rule', false, () => editor.chain().focus().setHorizontalRule().run(), <Minus size={14} />)}
        {sep()}
        {btn('Link', editor.isActive('link'), addLink, <Link2 size={14} />)}
        {btn('Image', false, addImage, <ImageIcon size={14} />)}
        {btn('Table', editor.isActive('table'), addTable, <Table size={14} />)}
      </div>
    </TooltipProvider>
  )
}
