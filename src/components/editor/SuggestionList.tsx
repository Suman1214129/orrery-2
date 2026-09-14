'use client'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/lib/utils'

interface Item { id: string; label: string }

interface Props {
  items: Item[]
  command: (item: Item) => void
}

export const SuggestionList = forwardRef<{ onKeyDown: (p: { event: KeyboardEvent }) => boolean }, Props>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0)

    useEffect(() => setSelected(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') { setSelected((s) => (s - 1 + items.length) % items.length); return true }
        if (event.key === 'ArrowDown') { setSelected((s) => (s + 1) % items.length); return true }
        if (event.key === 'Enter') { if (items[selected]) command(items[selected]); return true }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div className="suggestion-list">
        {items.map((item, i) => (
          <button
            key={item.id}
            className={cn('suggestion-item w-full text-left', i === selected && 'is-selected')}
            onClick={() => command(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }
)
SuggestionList.displayName = 'SuggestionList'
