'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { analytics } from '@repo/utils'

/**
 * Taskbar feedback control — compact trigger in the top menu bar with a
 * dropdown panel for bug reports, feature requests, and support.
 */
export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closePanel()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePanel()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closePanel, isOpen])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    analytics.track({
      eventName: 'User Feedback Submitted',
      properties: { type, messageLength: message.length },
    })

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message }),
    }).catch(() => {})

    setSubmitting(false)
    setMessage('')
    closePanel()
    alert('Thank you for your feedback! Our support team has received it.')
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Feedback and support"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium',
          'select-none outline-none transition-colors active:scale-[0.97]',
          'border-border-subtle bg-black/[0.03] text-text-heading',
          'hover:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50',
          isOpen && 'border-border-default bg-black/[0.1] shadow-sm'
        )}
      >
        <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Send feedback"
          className={cn(
            'absolute right-0 top-full z-[60] mt-1.5 w-80 p-4',
            'flex flex-col gap-4 rounded-xl border border-border-subtle',
            'bg-white/95 shadow-window backdrop-blur-xl'
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-arch-text-primary">Send Feedback</h3>
            <Button variant="ghost" size="sm" onClick={closePanel} aria-label="Close feedback">
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="bug">Report a Bug</option>
              <option value="feature">Suggest a Feature</option>
              <option value="general">General Feedback</option>
              <option value="support">Need Support</option>
            </select>
            <textarea
              placeholder="Please describe your issue or suggestion..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={submitting || !message}>
                {submitting ? 'Sending...' : 'Submit'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
