'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; context?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; context?: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture in Sentry with component context
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
      extra: { errorBoundaryContext: this.props.context },
    })
    Sentry.logger.error('ErrorBoundary caught error', {
      error_message: error.message,
      context: this.props.context ?? 'unknown',
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>
    }

    return this.props.children
  }
}
