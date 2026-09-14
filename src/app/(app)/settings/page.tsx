'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft, User, Palette, Keyboard, Key,
  Check, Edit2, X, LogOut, Sun, Moon, Monitor,
} from 'lucide-react'
import * as Avatar from '@radix-ui/react-avatar'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { createClient } from '@/lib/supabase/client'
import { cn, displayHotkey, parseHotkey } from '@/lib/utils'
import { HOTKEY_LABELS, DEFAULT_HOTKEYS, type HotkeyMap } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { theme, hotkeys, openrouterKey, setTheme, setHotkey, setOpenrouterKey, saveSettings } = useSettingsStore()

  const [apiKeyInput, setApiKeyInput] = useState(openrouterKey)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [recordingKey, setRecordingKey] = useState<keyof HotkeyMap | null>(null)
  const [recordedCombo, setRecordedCombo] = useState<string>('')

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '') as string
  const email = user?.email ?? ''

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  async function saveApiKey() {
    setOpenrouterKey(apiKeyInput)
    if (user) await saveSettings(user.id)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 2000)
  }

  // Hotkey recording
  const startRecording = useCallback((action: keyof HotkeyMap) => {
    setRecordingKey(action)
    setRecordedCombo('')
  }, [])

  const cancelRecording = useCallback(() => {
    setRecordingKey(null)
    setRecordedCombo('')
  }, [])

  const saveRecordedHotkey = useCallback(async () => {
    if (recordingKey && recordedCombo) {
      setHotkey(recordingKey, recordedCombo)
      if (user) await saveSettings(user.id)
    }
    setRecordingKey(null)
    setRecordedCombo('')
  }, [recordingKey, recordedCombo, setHotkey, saveSettings, user])

  useEffect(() => {
    if (!recordingKey) return

    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') { cancelRecording(); return }

      const parts: string[] = []
      if (e.ctrlKey) parts.push('ctrl')
      if (e.shiftKey) parts.push('shift')
      if (e.altKey) parts.push('alt')
      if (e.metaKey) parts.push('meta')

      const key = e.key.toLowerCase()
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        parts.push(key)
        setRecordedCombo(parts.join('+'))
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recordingKey, cancelRecording])

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden bg-[var(--bg)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ChevronLeft size={15} />
          </Button>
          <h1 className="text-sm font-semibold text-[var(--text)]">Settings</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <Tabs.Root defaultValue="account">
              <Tabs.List className="flex gap-1 mb-8 border-b border-[var(--border)] pb-0">
                {[
                  { value: 'account', label: 'Account', icon: User },
                  { value: 'appearance', label: 'Appearance', icon: Palette },
                  { value: 'hotkeys', label: 'Keyboard shortcuts', icon: Keyboard },
                  { value: 'ai', label: 'AI', icon: Key },
                ].map(({ value, label, icon: Icon }) => (
                  <Tabs.Trigger
                    key={value}
                    value={value}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                      'data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--accent)]',
                      'data-[state=inactive]:border-transparent data-[state=inactive]:text-[var(--text-muted)]',
                      'hover:text-[var(--text)]'
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {/* Account */}
              <Tabs.Content value="account">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                    <Avatar.Root className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      <Avatar.Image src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      <Avatar.Fallback className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-[var(--accent-fg)] text-xl font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">{displayName}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{email}</p>
                      <p className="text-[10px] text-[var(--text-subtle)] mt-1">
                        Avatar synced from your OAuth provider
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" size="md" onClick={handleSignOut} className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300">
                      <LogOut size={14} /> Sign out
                    </Button>
                  </div>
                </motion.div>
              </Tabs.Content>

              {/* Appearance */}
              <Tabs.Content value="appearance">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Theme</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {themes.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border-2 transition-all',
                            theme === value
                              ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]'
                          )}
                        >
                          <Icon size={20} className={theme === value ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                          <span className={cn('text-xs font-medium', theme === value ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
                            {label}
                          </span>
                          {theme === value && (
                            <div className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center">
                              <Check size={10} className="text-[var(--accent-fg)]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">Olive accent</p>
                        <p className="text-xs text-[var(--text-muted)]">Primary color used throughout the app</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Tabs.Content>

              {/* Hotkeys */}
              <Tabs.Content value="hotkeys">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    Click the edit button next to any shortcut, then press your desired key combination.
                  </p>
                  <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
                    {(Object.keys(HOTKEY_LABELS) as (keyof HotkeyMap)[]).map((action, i) => (
                      <div
                        key={action}
                        className={cn(
                          'flex items-center justify-between px-4 py-3',
                          i !== 0 && 'border-t border-[var(--border-subtle)]',
                          recordingKey === action && 'bg-[var(--accent-light)]'
                        )}
                      >
                        <span className="text-sm text-[var(--text)]">{HOTKEY_LABELS[action]}</span>

                        <div className="flex items-center gap-2">
                          {recordingKey === action ? (
                            <>
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius)] border-2 border-[var(--accent)] bg-[var(--surface)] min-w-[100px] justify-center">
                                {recordedCombo ? (
                                  <span className="text-xs font-mono font-semibold text-[var(--accent)]">
                                    {displayHotkey(recordedCombo)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-[var(--text-subtle)] animate-pulse">Press keys…</span>
                                )}
                              </div>
                              <Tooltip content="Save">
                                <Button
                                  size="icon-sm"
                                  onClick={saveRecordedHotkey}
                                  disabled={!recordedCombo}
                                >
                                  <Check size={12} />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Cancel">
                                <Button size="icon-sm" variant="ghost" onClick={cancelRecording}>
                                  <X size={12} />
                                </Button>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--bg-muted)] border border-[var(--border)] rounded text-[var(--text-muted)]">
                                {displayHotkey(hotkeys[action])}
                              </kbd>
                              <Tooltip content="Edit shortcut">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => startRecording(action)}
                                >
                                  <Edit2 size={12} />
                                </Button>
                              </Tooltip>
                              {hotkeys[action] !== DEFAULT_HOTKEYS[action] && (
                                <Tooltip content="Reset to default">
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      setHotkey(action, DEFAULT_HOTKEYS[action])
                                      if (user) await saveSettings(user.id)
                                    }}
                                  >
                                    <X size={12} />
                                  </Button>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Tabs.Content>

              {/* AI */}
              <Tabs.Content value="ai">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] mb-1">OpenRouter API Key</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3">
                      Used for AI branch generation and note Q&A. Get a key at{' '}
                      <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                        openrouter.ai
                      </a>
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-or-v1-…"
                        className="flex-1 font-mono text-xs"
                      />
                      <Button onClick={saveApiKey} disabled={!apiKeyInput}>
                        {apiKeySaved ? <Check size={14} /> : 'Save'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
                    <p className="text-xs font-medium text-[var(--text)] mb-1">Model</p>
                    <p className="text-xs text-[var(--text-muted)]">nvidia/nemotron-3-ultra-550b-a55b:free</p>
                    <p className="text-[11px] text-[var(--text-subtle)] mt-1">Via OpenRouter — free tier</p>
                  </div>
                </motion.div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
