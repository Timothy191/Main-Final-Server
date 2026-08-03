'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.warn('[pwa] User accepted the install prompt')
    } else {
      console.warn('[pwa] User dismissed the install prompt')
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShowInstallPrompt(false)
    // Don't clear deferredPrompt - user can trigger install via other means
  }, [])

  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-[9998] flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-card rounded-lg p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-arch-text-primary">Install Arch Portal</p>
        <p className="text-xs text-arch-text-muted">Add to home screen for offline access</p>
      </div>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-2 bg-arch-accent-charcoal text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Download className="h-4 w-4" />
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-arch-text-muted hover:text-arch-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
