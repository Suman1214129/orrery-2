import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default:   'bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]',
        secondary: 'bg-[var(--bg-muted)] text-[var(--text)] hover:bg-[var(--border)]',
        ghost:     'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]',
        outline:   'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--bg-subtle)]',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        link:      'text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:   'h-7 px-2.5 text-xs',
        md:   'h-8 px-3',
        lg:   'h-10 px-4 text-base',
        icon: 'h-8 w-8 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  }
)
Button.displayName = 'Button'
