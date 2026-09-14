'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Loader2, GitBranch, Check, X, RotateCcw } from 'lucide-react'
import { useEditorStore } from '@/store/editor'
import { useSettingsStore } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  noteId: string
  noteContent: string
}

export function AISidebar({ noteId, noteContent }: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    aiMessages, aiLoading, branchReviewContent, branchReviewId,
    addAiMessage, setAiLoading, updateLastAiMessage, clearAiMessages,
    setBranchReview, selectedCheckpointId, createBranch, acceptBranch, rejectBranch,
  } = useEditorStore()

  const openrouterKey = useSettingsStore((s) => s.openrouterKey)
  const { user } = useAuthStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || aiLoading) return

    const userMsg = input.trim()
    setInput('')
    addAiMessage({ role: 'user', content: userMsg })
    setAiLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent,
          question: userMsg,
          apiKey: openrouterKey,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            const chunk = json.choices?.[0]?.delta?.content ?? ''
            if (chunk) updateLastAiMessage(chunk)
          } catch {}
        }
      }
    } catch (err) {
      addAiMessage({ role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` })
    } finally {
      setAiLoading(false)
    }
  }

  async function generateBranch() {
    if (!selectedCheckpointId || !input.trim() || aiLoading || !user) return

    const prompt = input.trim()
    setInput('')
    addAiMessage({ role: 'user', content: `Fork: ${prompt}` })
    setAiLoading(true)

    try {
      const res = await fetch('/api/ai/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent,
          prompt,
          apiKey: openrouterKey,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            const chunk = json.choices?.[0]?.delta?.content ?? ''
            if (chunk) { fullContent += chunk; updateLastAiMessage(chunk) }
          } catch {}
        }
      }

      // Create branch record and show review
      const branch = await createBranch(noteId, user.id, selectedCheckpointId, prompt, prompt)
      setBranchReview(fullContent, branch.id)
    } catch (err) {
      addAiMessage({ role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` })
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAcceptBranch() {
    if (branchReviewId) {
      await acceptBranch(branchReviewId)
      setBranchReview(null, null)
      addAiMessage({ role: 'assistant', content: '✓ Branch accepted and saved.' })
    }
  }

  async function handleRejectBranch() {
    if (branchReviewId) {
      await rejectBranch(branchReviewId)
      setBranchReview(null, null)
      addAiMessage({ role: 'assistant', content: '✗ Branch rejected.' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-subtle)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--text)]">AI</span>
        </div>
        <button
          onClick={clearAiMessages}
          className="text-[10px] text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Context indicator */}
      {selectedCheckpointId && (
        <div className="px-3 py-2 bg-[var(--accent-light)] border-b border-[var(--border)]">
          <p className="text-[11px] text-[var(--accent)] flex items-center gap-1.5">
            <GitBranch size={11} />
            Checkpoint selected — use "Fork" to generate a branch
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {aiMessages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-[var(--text-subtle)]">
              Ask anything about this note, or select a checkpoint and fork a branch.
            </p>
            <div className="mt-3 space-y-1.5">
              {['What are the key themes here?', 'What if the protagonist made a different choice?', 'Suggest a plot twist'].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="block w-full text-left text-xs px-3 py-2 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-xs rounded-[var(--radius)] px-3 py-2 leading-relaxed',
              msg.role === 'user'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] ml-4'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] mr-4'
            )}
          >
            {msg.content}
          </motion.div>
        ))}

        {aiLoading && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)] mr-4">
            <Loader2 size={12} className="animate-spin" />
            Thinking…
          </div>
        )}

        {/* Branch review */}
        <AnimatePresence>
          {branchReviewContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-[var(--radius-lg)] border-2 border-[var(--accent)] bg-[var(--surface)] p-3"
            >
              <p className="text-[11px] font-semibold text-[var(--accent)] mb-2 flex items-center gap-1">
                <GitBranch size={11} /> Branch ready for review
              </p>
              <p className="text-xs text-[var(--text-muted)] line-clamp-4 mb-3">
                {branchReviewContent.slice(0, 200)}…
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAcceptBranch} className="flex-1">
                  <Check size={12} /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleRejectBranch} className="flex-1">
                  <X size={12} /> Reject
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border)]">
        <form onSubmit={sendMessage} className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder={selectedCheckpointId ? 'Ask or describe a fork…' : 'Ask about this note…'}
            rows={2}
            className="w-full resize-none text-xs rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <div className="flex gap-1.5">
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="flex-1"
              disabled={!input.trim() || aiLoading}
            >
              <Send size={12} /> Ask
            </Button>
            {selectedCheckpointId && (
              <Button
                type="button"
                size="sm"
                className="flex-1"
                disabled={!input.trim() || aiLoading}
                onClick={generateBranch}
              >
                <GitBranch size={12} /> Fork
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
