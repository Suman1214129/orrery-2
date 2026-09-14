import { create } from 'zustand'
import type { Checkpoint, Branch } from '@/types'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'

type EditorView = 'editor' | 'canvas'
type SidebarMode = 'files' | 'ai'

interface EditorState {
  view: EditorView
  sidebarMode: SidebarMode
  checkpoints: Checkpoint[]
  branches: Branch[]
  selectedCheckpointId: string | null
  aiMessages: { role: 'user' | 'assistant'; content: string }[]
  aiLoading: boolean
  branchReviewContent: string | null
  branchReviewId: string | null

  setView: (v: EditorView) => void
  setSidebarMode: (m: SidebarMode) => void
  setSelectedCheckpoint: (id: string | null) => void
  addAiMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void
  setAiLoading: (v: boolean) => void
  updateLastAiMessage: (chunk: string) => void
  clearAiMessages: () => void
  setBranchReview: (content: string | null, id: string | null) => void

  loadCheckpoints: (noteId: string) => Promise<void>
  createCheckpoint: (noteId: string, userId: string, label: string, content: string, parentId?: string) => Promise<Checkpoint>
  createBranch: (noteId: string, userId: string, fromCheckpointId: string, label: string, prompt: string) => Promise<Branch>
  acceptBranch: (branchId: string) => Promise<void>
  rejectBranch: (branchId: string) => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  view: 'editor',
  sidebarMode: 'files',
  checkpoints: [],
  branches: [],
  selectedCheckpointId: null,
  aiMessages: [],
  aiLoading: false,
  branchReviewContent: null,
  branchReviewId: null,

  setView: (v) => set({ view: v }),
  setSidebarMode: (m) => set({ sidebarMode: m }),
  setSelectedCheckpoint: (id) => set({ selectedCheckpointId: id }),
  addAiMessage: (msg) => set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
  setAiLoading: (v) => set({ aiLoading: v }),
  updateLastAiMessage: (chunk) =>
    set((s) => {
      const msgs = [...s.aiMessages]
      if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + chunk }
      } else {
        msgs.push({ role: 'assistant', content: chunk })
      }
      return { aiMessages: msgs }
    }),
  clearAiMessages: () => set({ aiMessages: [] }),
  setBranchReview: (content, id) => set({ branchReviewContent: content, branchReviewId: id }),

  loadCheckpoints: async (noteId) => {
    const supabase = createClient()
    const [{ data: cps }, { data: brs }] = await Promise.all([
      supabase.from('checkpoints').select('*').eq('note_id', noteId).order('position'),
      supabase.from('branches').select('*').eq('note_id', noteId),
    ])
    const checkpoints = cps ?? []
    const branches = brs ?? []
    await db.checkpoints.bulkPut(checkpoints)
    await db.branches.bulkPut(branches)
    set({ checkpoints, branches })
  },

  createCheckpoint: async (noteId, userId, label, content, parentId) => {
    const { checkpoints } = get()
    const position = checkpoints.filter((c) => c.note_id === noteId).length
    const cp: Checkpoint = {
      id: generateId(),
      note_id: noteId,
      user_id: userId,
      label,
      content,
      position,
      parent_checkpoint_id: parentId ?? null,
      branch_label: null,
      is_main: !parentId,
      created_at: new Date().toISOString(),
    }
    await db.checkpoints.add(cp)
    const supabase = createClient()
    await supabase.from('checkpoints').insert(cp)
    set((s) => ({ checkpoints: [...s.checkpoints, cp] }))
    return cp
  },

  createBranch: async (noteId, userId, fromCheckpointId, label, prompt) => {
    const branch: Branch = {
      id: generateId(),
      note_id: noteId,
      user_id: userId,
      from_checkpoint_id: fromCheckpointId,
      label,
      prompt,
      ai_generated: true,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    await db.branches.add(branch)
    const supabase = createClient()
    await supabase.from('branches').insert(branch)
    set((s) => ({ branches: [...s.branches, branch] }))
    return branch
  },

  acceptBranch: async (branchId) => {
    await db.branches.update(branchId, { status: 'accepted' })
    const supabase = createClient()
    await supabase.from('branches').update({ status: 'accepted' }).eq('id', branchId)
    set((s) => ({
      branches: s.branches.map((b) => b.id === branchId ? { ...b, status: 'accepted' } : b),
    }))
  },

  rejectBranch: async (branchId) => {
    await db.branches.update(branchId, { status: 'rejected' })
    const supabase = createClient()
    await supabase.from('branches').update({ status: 'rejected' }).eq('id', branchId)
    set((s) => ({
      branches: s.branches.map((b) => b.id === branchId ? { ...b, status: 'rejected' } : b),
    }))
  },
}))
