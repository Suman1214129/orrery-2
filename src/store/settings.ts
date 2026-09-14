import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings, HotkeyMap } from '@/types'
import { DEFAULT_HOTKEYS } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface SettingsState {
  theme: UserSettings['theme']
  hotkeys: HotkeyMap
  openrouterKey: string

  setTheme: (theme: UserSettings['theme']) => void
  setHotkey: (action: keyof HotkeyMap, value: string) => void
  setOpenrouterKey: (key: string) => void
  loadSettings: (userId: string) => Promise<void>
  saveSettings: (userId: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      hotkeys: DEFAULT_HOTKEYS,
      openrouterKey: process.env.NEXT_PUBLIC_OPENROUTER_KEY ?? '',

      setTheme: (theme) => set({ theme }),
      setHotkey: (action, value) =>
        set((s) => ({ hotkeys: { ...s.hotkeys, [action]: value } })),
      setOpenrouterKey: (key) => set({ openrouterKey: key }),

      loadSettings: async (userId) => {
        const supabase = createClient()
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single()
        if (data) {
          set({
            theme: data.theme ?? 'system',
            hotkeys: { ...DEFAULT_HOTKEYS, ...(data.hotkeys ?? {}) },
            openrouterKey: data.openrouter_key ?? get().openrouterKey,
          })
        }
      },

      saveSettings: async (userId) => {
        const { theme, hotkeys, openrouterKey } = get()
        const supabase = createClient()
        await supabase.from('user_settings').upsert({
          user_id: userId,
          theme,
          hotkeys,
          openrouter_key: openrouterKey,
        })
      },
    }),
    { name: 'orrery-settings' }
  )
)
