'use client'
import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import ELK from 'elkjs/lib/elk.bundled.js'
import { motion } from 'framer-motion'
import { GitBranch, Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editor'
import { Button } from '@/components/ui/Button'
import type { Checkpoint, Branch } from '@/types'
import { CheckpointNode } from './CheckpointNode'

const elk = new ELK()
const nodeTypes = { checkpoint: CheckpointNode }

async function layoutGraph(
  checkpoints: Checkpoint[],
  branches: Branch[]
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const elkNodes = checkpoints.map((cp) => ({ id: cp.id, width: 200, height: 72 }))
  const elkEdges = checkpoints
    .filter((cp) => cp.parent_checkpoint_id)
    .map((cp) => ({
      id: `e-${cp.parent_checkpoint_id}-${cp.id}`,
      sources: [cp.parent_checkpoint_id!],
      targets: [cp.id],
    }))

  const laid = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
    },
    children: elkNodes,
    edges: elkEdges,
  })

  const nodes: Node[] = (laid.children ?? []).map((n) => {
    const cp = checkpoints.find((c) => c.id === n.id)!
    return {
      id: n.id,
      type: 'checkpoint',
      position: { x: n.x ?? 0, y: n.y ?? 0 },
      data: {
        checkpoint: cp,
        branches: branches.filter((b) => b.from_checkpoint_id === cp.id),
        isMain: cp.is_main,
      },
    }
  })

  const edges: Edge[] = elkEdges.map((e) => ({
    id: e.id,
    source: e.sources[0],
    target: e.targets[0],
    style: { stroke: 'var(--border)', strokeWidth: 2 },
  }))

  return { nodes, edges }
}

interface Props {
  noteId: string
  onNodeClick: (checkpointId: string) => void
  onForkRequest: (checkpointId: string) => void
}

export function CheckpointCanvas({ noteId, onNodeClick, onForkRequest }: Props) {
  const { checkpoints, branches, selectedCheckpointId, setSelectedCheckpoint } = useEditorStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const noteCheckpoints = useMemo(
    () => checkpoints.filter((c) => c.note_id === noteId),
    [checkpoints, noteId]
  )
  const noteBranches = useMemo(
    () => branches.filter((b) => b.note_id === noteId),
    [branches, noteId]
  )

  useEffect(() => {
    if (!noteCheckpoints.length) return
    layoutGraph(noteCheckpoints, noteBranches).then(({ nodes, edges }) => {
      setNodes(nodes)
      setEdges(edges)
    })
  }, [noteCheckpoints, noteBranches, setNodes, setEdges])

  const onNodeClickHandler = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedCheckpoint(node.id)
      onNodeClick(node.id)
    },
    [setSelectedCheckpoint, onNodeClick]
  )

  if (!noteCheckpoints.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--accent-light)] flex items-center justify-center">
          <GitBranch size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text)]">No checkpoints yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add a checkpoint in the editor to start branching.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => (n.data?.isMain ? 'var(--accent)' : 'var(--border)')}
          maskColor="rgba(0,0,0,0.05)"
        />
        {selectedCheckpointId && (
          <Panel position="bottom-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] px-3 py-2 shadow-[var(--shadow-md)]"
            >
              <span className="text-xs text-[var(--text-muted)]">Checkpoint selected</span>
              <Button size="sm" onClick={() => onForkRequest(selectedCheckpointId)}>
                <Sparkles size={13} /> Fork branch
              </Button>
            </motion.div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
