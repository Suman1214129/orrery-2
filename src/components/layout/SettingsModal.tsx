'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Palette, Keyboard, Check, Edit2, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import * as Tabs from '@radix-ui/react-tabs'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Button } from '@/components/ui/Button'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { createClient } from '@/lib/supabase/client'
import { cn, displayHotkey } from '@/lib/utils'
import { HOTKEY_LABELS, DEFAULT_HOTKEYS, type HotkeyMap } from '@/types'
import { useRouter } from 'next/navigation'

interface Props { open: boolean; onClose: () => void }

export function SettingsModal({ open, onClose }: Props) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { theme, hotkeys, setTheme, setHotkey, saveSettings } = useSettingsStore()
  const [recordingKey, setRecordingKey] = useState<keyof HotkeyMap | null>(null)
  const [recordedCombo, setRecordedCombo] = useState('')

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string
  const email = user?.email ?? ''

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.push('/sign-in')
  }

  const startRecording = useCallback((action: keyof HotkeyMap) => {
    setRecordingKey(action); setRecordedCombo('')
  }, [])

  const cancelRecording = useCallback(() => {
    setRecordingKey(null); setRecordedCombo('')
  }, [])

  const saveRecordedHotkey = useCallback(async () => {
    if (recordingKey && recordedCombo) {
      setHotkey(recordingKey, recordedCombo)
      if (user) await saveSettings(user.id)
    }
    setRecordingKey(null); setRecordedCombo('')
  }, [recordingKey, recordedCombo, setHotkey, saveSettings, user])

  useEffect(() => {
    if (!recordingKey) return
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault(); e.stopPropagation()
      if (e.key === 'Escape') { cancelRecording(); return }
      const parts: string[] = []
      if (e.ctrlKey) parts.push('ctrl')
      if (e.shiftKey) parts.push('shift')
      if (e.altKey) parts.push('alt')
      if (e.metaKey) parts.push('meta')
      const key = e.key.toLowerCase()
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        parts.push(key); setRecordedCombo(parts.join('+'))
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recordingKey, cancelRecording])

  // Close on Escape
  useEffect(() => {
    if (!open || recordingKey) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, recordingKey])

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <AnimatePresence>
      {open && (
        <TooltipProvider>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '80vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                <span className="text-sm font-semibold text-[var(--text)]">Settings</span>
                <button onClick={onClose} className="flex items-center justify-center size-7 rounded-lg text-[var(--text-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] transition-colors focus:outline-none">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Tabs.Root defaultValue="account">
                  <Tabs.List className="flex gap-0 border-b border-[var(--border)] px-5">
                    {[
                      { value: 'account', label: 'Account', icon: User },
                      { value: 'appearance', label: 'Appearance', icon: Palette },
                      { value: 'hotkeys', label: 'Shortcuts', icon: Keyboard },
                    ].map(({ value, label, icon: Icon }) => (
                      <Tabs.Trigger key={value} value={value}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
                          'data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]',
                          'data-[state=inactive]:border-transparent data-[state=inactive]:text-[var(--text-muted)]',
                          'hover:text-[var(--text)]'
                        )}>
                        <Icon size={13} />{label}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  <div className="px-5 py-5">
                    {/* Account */}
                    <Tabs.Content value="account" className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]">
                        <Avatar.Root className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <Avatar.Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                          <Avatar.Fallback className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-lg font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text)] truncate">{displayName}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{email}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="md" onClick={handleSignOut} className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300">
                        <LogOut size={14} /> Sign out
                      </Button>
                    </Tabs.Content>

                    {/* Appearance */}
                    <Tabs.Content value="appearance" className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-subtle)] uppercase tracking-wider mb-3">Theme</p>
                        <div className="grid grid-cols-3 gap-2">
                          {themes.map(({ value, label, icon: Icon }) => (
                            <button key={value} onClick={() => setTheme(value)}
                              className={cn(
                                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all focus:outline-none',
                                theme === value
                                  ? 'border-[var(--accent)] bg-[var(--bg-subtle)]'
                                  : 'border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--text-subtle)]'
                              )}>
                              <Icon size={18} className={theme === value ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                              <span className={cn('text-xs font-medium', theme === value ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>{label}</span>
                              {theme === value && <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] flex items-center justify-center"><Check size={9} className="text-white" /></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Tabs.Content>

                    {/* Hotkeys */}
                    <Tabs.Content value="hotkeys">
                      <p className="text-xs text-[var(--text-muted)] mb-3">Click edit, then press your desired key combination.</p>
                      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                        {(Object.keys(HOTKEY_LABELS) as (keyof HotkeyMap)[]).map((action, i) => (
                          <div key={action}
                            className={cn(
                              'flex items-center justify-between px-4 py-2.5',
                              i !== 0 && 'border-t border-[var(--border-subtle)]',
                              recordingKey === action && 'bg-[var(--bg-subtle)]'
                            )}>
                            <span className="text-sm text-[var(--text)]">{HOTKEY_LABELS[action]}</span>
                            <div className="flex items-center gap-2">
                              {recordingKey === action ? (
                                <>
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-[var(--accent)] bg-[var(--surface)] min-w-[90px] justify-center">
                                    {recordedCombo
                                      ? <span className="text-xs font-mono font-semibold text-[var(--accent)]">{displayHotkey(recordedCombo)}</span>
                                      : <span className="text-xs text-[var(--text-subtle)] animate-pulse">Press keys…</span>
                                    }
                                  </div>
                                  <Tooltip content="Save">
                                    <Button size="icon-sm" onClick={saveRecordedHotkey} disabled={!recordedCombo}><Check size={12} /></Button>
                                  </Tooltip>
                                  <Tooltip content="Cancel">
                                    <Button size="icon-sm" variant="ghost" onClick={cancelRecording}><X size={12} /></Button>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--bg-muted)] border border-[var(--border)] rounded text-[var(--text-muted)]">
                                    {displayHotkey(hotkeys[action])}
                                  </kbd>
                                  <Tooltip content="Edit">
                                    <Button size="icon-sm" variant="ghost" onClick={() => startRecording(action)}><Edit2 size={12} /></Button>
                                  </Tooltip>
                                  {hotkeys[action] !== DEFAULT_HOTKEYS[action] && (
                                    <Tooltip content="Reset">
                                      <Button size="icon-sm" variant="ghost" onClick={async () => { setHotkey(action, DEFAULT_HOTKEYS[action]); if (user) await saveSettings(user.id) }}><X size={12} /></Button>
                                    </Tooltip>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Tabs.Content>
                  </div>
                </Tabs.Root>
              </div>
            </div>
          </motion.div>
        </TooltipProvider>
      )}
    </AnimatePresence>
  )
}
