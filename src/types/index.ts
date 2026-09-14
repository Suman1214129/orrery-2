export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  parent_id: string | null
  folder_id: string | null
  tags: string[]
  is_deleted: boolean
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface Checkpoint {
  id: string
  note_id: string
  user_id: string
  label: string
  content: string
  position: number
  parent_checkpoint_id: string | null
  branch_label: string | null
  is_main: boolean
  created_at: string
}

export interface Branch {
  id: string
  note_id: string
  user_id: string
  from_checkpoint_id: string
  label: string
  prompt: string
  ai_generated: boolean
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface UserSettings {
  user_id: string
  theme: 'light' | 'dark' | 'system'
  hotkeys: HotkeyMap
  openrouter_key: string | null
}

export interface HotkeyMap {
  newNote: string
  saveNote: string
  toggleSidebar: string
  toggleCanvas: string
  forkBranch: string
  openSearch: string
  openSettings: string
  bold: string
  italic: string
  strikethrough: string
  heading1: string
  heading2: string
  heading3: string
}

export const DEFAULT_HOTKEYS: HotkeyMap = {
  newNote: 'ctrl+n',
  saveNote: 'ctrl+s',
  toggleSidebar: 'ctrl+\\',
  toggleCanvas: 'ctrl+shift+v',
  forkBranch: 'ctrl+shift+b',
  openSearch: 'ctrl+k',
  openSettings: 'ctrl+,',
  bold: 'ctrl+b',
  italic: 'ctrl+i',
  strikethrough: 'ctrl+shift+s',
  heading1: 'ctrl+alt+1',
  heading2: 'ctrl+alt+2',
  heading3: 'ctrl+alt+3',
}

export const HOTKEY_LABELS: Record<keyof HotkeyMap, string> = {
  newNote: 'New Note',
  saveNote: 'Save Note',
  toggleSidebar: 'Toggle Sidebar',
  toggleCanvas: 'Toggle Canvas View',
  forkBranch: 'Fork Branch',
  openSearch: 'Quick Search',
  openSettings: 'Open Settings',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
}
