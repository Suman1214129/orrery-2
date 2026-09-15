'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, GitBranch, Check, X } from 'lucide-react'
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

      {/* Input — Gray Toolbar Textarea */}
      <div className="p-3 border-t border-[var(--border)]">
        <form onSubmit={sendMessage}>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              placeholder="Ask me anything..."
              rows={3}
              className="p-3 sm:p-4 pb-12 sm:pb-12 block w-full resize-none bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
            />

            {/* Toolbar — overlaid on textarea's bottom padding */}
            <div className="absolute bottom-px inset-x-px p-2 rounded-b-[var(--radius-lg)] bg-[var(--surface)] flex flex-wrap justify-between items-center gap-2">

              {/* Left group: stop + attach */}
              <div className="flex items-center gap-1">
                {/* Stop / square icon */}
                <button
                  type="button"
                  onClick={clearAiMessages}
                  disabled={aiLoading}
                  aria-label="Clear conversation"
                  className="size-8 inline-flex items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] focus:outline-none focus:bg-[var(--bg-muted)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
                    <rect width="14" height="14" x="5" y="5" rx="2"/>
                  </svg>
                </button>

                {/* Paperclip / attach */}
                <button
                  type="button"
                  aria-label="Attach file"
                  className="size-8 inline-flex items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] focus:outline-none focus:bg-[var(--bg-muted)] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
              </div>

              {/* Right group: mic + send */}
              <div className="flex items-center gap-1">
                {/* Fork button (replaces mic when checkpoint selected) */}
                {selectedCheckpointId ? (
                  <button
                    type="button"
                    onClick={generateBranch}
                    disabled={!input.trim() || aiLoading}
                    aria-label="Fork branch"
                    className="size-8 inline-flex items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] focus:outline-none focus:bg-[var(--bg-muted)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <GitBranch className="size-4 shrink-0" />
                  </button>
                ) : (
                  /* Microphone */
                  <button
                    type="button"
                    aria-label="Voice input"
                    className="size-8 inline-flex items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)] focus:outline-none focus:bg-[var(--bg-muted)] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" x2="12" y1="19" y2="22"/>
                    </svg>
                  </button>
                )}

                {/* Send — filled primary button */}
                <button
                  type="submit"
                  disabled={!input.trim() || aiLoading}
                  aria-label="Send message"
                  className="size-8 inline-flex items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] border border-[var(--accent-hover)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] focus:outline-none focus:bg-[var(--accent-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  {aiLoading
                    ? <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    : (
                      /* Filled paper-plane on 16 viewBox, size-3.5 */
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0">
                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L2.033 6.849l4.338 2.761z"/>
                      </svg>
                    )
                  }
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
