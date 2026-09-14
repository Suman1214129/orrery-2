import { create } from 'zustand'
import type { Note, Folder } from '@/types'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'

interface NotesState {
  notes: Note[]
  folders: Folder[]
  activeNoteId: string | null
  sidebarOpen: boolean
  searchQuery: string
  loading: boolean

  setActiveNote: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (q: string) => void

  loadNotes: (userId: string) => Promise<void>
  createNote: (userId: string, folderId?: string) => Promise<Note>
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  createFolder: (userId: string, name: string, parentId?: string) => Promise<Folder>
  deleteFolder: (id: string) => Promise<void>
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  activeNoteId: null,
  sidebarOpen: true,
  searchQuery: '',
  loading: false,

  setActiveNote: (id) => set({ activeNoteId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  loadNotes: async (userId) => {
    set({ loading: true })
    const supabase = createClient()
    const [{ data: notes }, { data: folders }] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', userId).eq('is_deleted', false).order('updated_at', { ascending: false }),
      supabase.from('folders').select('*').eq('user_id', userId).order('name'),
    ])
    const noteList = notes ?? []
    const folderList = folders ?? []
    // sync to local
    await db.notes.bulkPut(noteList)
    await db.folders.bulkPut(folderList)
    set({ notes: noteList, folders: folderList, loading: false })
  },

  createNote: async (userId, folderId) => {
    const note: Note = {
      id: generateId(),
      user_id: userId,
      title: 'Untitled',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: null,
      folder_id: folderId ?? null,
      tags: [],
      is_deleted: false,
    }
    await db.notes.add(note)
    const supabase = createClient()
    await supabase.from('notes').insert(note)
    set((s) => ({ notes: [note, ...s.notes], activeNoteId: note.id }))
    return note
  },

  updateNote: async (id, patch) => {
    const updated = { ...patch, updated_at: new Date().toISOString() }
    await db.notes.update(id, updated)
    const supabase = createClient()
    await supabase.from('notes').update(updated).eq('id', id)
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...updated } : n)),
    }))
  },

  deleteNote: async (id) => {
    await db.notes.update(id, { is_deleted: true })
    const supabase = createClient()
    await supabase.from('notes').update({ is_deleted: true }).eq('id', id)
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      activeNoteId: s.activeNoteId === id ? null : s.activeNoteId,
    }))
  },

  createFolder: async (userId, name, parentId) => {
    const folder: Folder = {
      id: generateId(),
      user_id: userId,
      name,
      parent_id: parentId ?? null,
      created_at: new Date().toISOString(),
    }
    await db.folders.add(folder)
    const supabase = createClient()
    await supabase.from('folders').insert(folder)
    set((s) => ({ folders: [...s.folders, folder] }))
    return folder
  },

  deleteFolder: async (id) => {
    await db.folders.delete(id)
    const supabase = createClient()
    await supabase.from('folders').delete().eq('id', id)
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }))
  },
}))
