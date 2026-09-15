'use client'
import dynamic from 'next/dynamic'

const NoteEditorInner = dynamic(() => import('./NoteEditorInner').then(m => ({ default: m.NoteEditorInner })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
    </div>
  ),
})

interface Props {
  noteId: string
  content: string
  onChange: (html: string) => void
}

export function NoteEditor(props: Props) {
  return <NoteEditorInner {...props} />
}
