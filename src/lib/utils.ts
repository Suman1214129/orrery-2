import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: days > 365 ? 'numeric' : undefined })
}

export function generateId() {
  return crypto.randomUUID()
}

export function parseHotkey(hotkey: string): { key: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } {
  const parts = hotkey.toLowerCase().split('+')
  return {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta'),
    key: parts[parts.length - 1],
  }
}

export function matchesHotkey(e: KeyboardEvent, hotkey: string): boolean {
  const parsed = parseHotkey(hotkey)
  return (
    e.key.toLowerCase() === parsed.key &&
    e.ctrlKey === parsed.ctrl &&
    e.shiftKey === parsed.shift &&
    e.altKey === parsed.alt &&
    e.metaKey === parsed.meta
  )
}

export function displayHotkey(hotkey: string): string {
  return hotkey
    .split('+')
    .map(k => {
      if (k === 'ctrl') return '⌃'
      if (k === 'shift') return '⇧'
      if (k === 'alt') return '⌥'
      if (k === 'meta') return '⌘'
      return k.toUpperCase()
    })
    .join('')
}
