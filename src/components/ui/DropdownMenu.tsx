'use client'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator

export function DropdownMenuContent({
  children,
  className,
  align = 'start',
  sideOffset = 6,
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[160px] rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)] p-1',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  children,
  className,
  onSelect,
  destructive,
  disabled,
}: {
  children: React.ReactNode
  className?: string
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-[var(--radius-sm)] cursor-pointer select-none outline-none transition-colors',
        'text-[var(--text)] focus:bg-[var(--bg-subtle)]',
        destructive && 'text-red-500 focus:bg-red-50 focus:text-red-600',
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-2.5 py-1 text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider">
      {children}
    </DropdownMenuPrimitive.Label>
  )
}
