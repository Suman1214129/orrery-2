'use client'
import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Checkpoint, Branch } from '@/types'

type CheckpointNodeData = {
  checkpoint: Checkpoint
  branches: Branch[]
  isMain: boolean
}

export const CheckpointNode = memo(({ data, selected }: NodeProps) => {
  const { checkpoint, branches, isMain } = data as unknown as CheckpointNodeData
  const [hovered, setHovered] = useState(false)

  const pendingBranches = branches?.filter((b) => b.status === 'pending') ?? []
  const acceptedBranches = branches?.filter((b) => b.status === 'accepted') ?? []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative w-[200px] rounded-[var(--radius-lg)] border-2 bg-[var(--surface)] transition-all cursor-pointer',
        selected
          ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-light)]'
          : isMain
          ? 'border-[var(--accent)] opacity-90'
          : 'border-[var(--border)]',
        hovered && !selected && 'border-[var(--accent)] shadow-[var(--shadow-md)]'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--accent)] !border-[var(--surface)] !w-2.5 !h-2.5" />

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isMain ? 'bg-[var(--accent)]' : 'bg-[var(--text-subtle)]')} />
          <span className="text-xs font-semibold text-[var(--text)] truncate">
            {checkpoint?.label || 'Checkpoint'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {checkpoint?.content?.replace(/<[^>]+>/g, '').slice(0, 80) || 'Empty'}
        </p>

        {(pendingBranches.length > 0 || acceptedBranches.length > 0) && (
          <div className="flex items-center gap-1.5 mt-2">
            {acceptedBranches.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--accent-light)] text-[var(--accent)] rounded-full px-1.5 py-0.5">
                <GitBranch size={9} /> {acceptedBranches.length}
              </span>
            )}
            {pendingBranches.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 rounded-full px-1.5 py-0.5">
                <Sparkles size={9} /> {pendingBranches.length} pending
              </span>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] bg-[var(--text)] text-[var(--bg)] rounded-full px-2 py-0.5 pointer-events-none z-10"
          >
            Click to select · open AI panel to fork
          </motion.div>
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--accent)] !border-[var(--surface)] !w-2.5 !h-2.5" />
    </div>
  )
})
CheckpointNode.displayName = 'CheckpointNode'
