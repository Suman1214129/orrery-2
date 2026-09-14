'use client'
import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { WikiLink, buildWikiLinkSuggestion } from './WikiLink'
import { TagExtension, buildTagSuggestion } from './TagExtension'
import { EditorToolbar } from './EditorToolbar'
import { useNotesStore } from '@/store/notes'
import { useSettingsStore } from '@/store/settings'
import { matchesHotkey } from '@/lib/utils'

const lowlight = createLowlight(common)

interface Props {
  noteId: string
  content: string
  onChange: (html: string) => void
}

export function NoteEditor({ noteId, content, onChange }: Props) {
  const notes = useNotesStore((s) => s.notes)
  const hotkeys = useSettingsStore((s) => s.hotkeys)

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)))

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder: 'Start writing… use [[ for wiki-links, # for tags' }),
      CodeBlockLowlight.configure({ lowlight }),
      WikiLink.configure({
        suggestion: buildWikiLinkSuggestion(() =>
          notes.map((n) => ({ id: n.id, title: n.title || 'Untitled' }))
        ),
      }),
      TagExtension.configure({
        suggestion: buildTagSuggestion(() => allTags),
      }),
    ],
    content,
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync content when note changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Hotkeys
  useEffect(() => {
    if (!editor) return
    function onKeyDown(e: KeyboardEvent) {
      if (matchesHotkey(e, hotkeys.bold)) { e.preventDefault(); editor!.chain().focus().toggleBold().run() }
      if (matchesHotkey(e, hotkeys.italic)) { e.preventDefault(); editor!.chain().focus().toggleItalic().run() }
      if (matchesHotkey(e, hotkeys.strikethrough)) { e.preventDefault(); editor!.chain().focus().toggleStrike().run() }
      if (matchesHotkey(e, hotkeys.heading1)) { e.preventDefault(); editor!.chain().focus().toggleHeading({ level: 1 }).run() }
      if (matchesHotkey(e, hotkeys.heading2)) { e.preventDefault(); editor!.chain().focus().toggleHeading({ level: 2 }).run() }
      if (matchesHotkey(e, hotkeys.heading3)) { e.preventDefault(); editor!.chain().focus().toggleHeading({ level: 3 }).run() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor, hotkeys])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
