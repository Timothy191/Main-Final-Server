'use client'

import { type ReactNode } from 'react'
import { ArchThemeProvider } from '@repo/theme/react'
import { ErrorBoundary } from './ErrorBoundary'

interface DesignSystemProviderProps {
  children: ReactNode
  /** Optional fallback UI for errors. Receives error and reset function. */
  errorFallback?: (error: Error, reset: () => void) => ReactNode
  /** Called when ErrorBoundary catches an error */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

/**
 * DesignSystemProvider — single entry point for all Arch design system context.
 *
 * Composes the theme provider and error boundary so consumers only need one
 * wrapper at the root of their application.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { DesignSystemProvider } from "@repo/ui";
 *
 * export default function RootLayout({ children }) {
 *   return <DesignSystemProvider>{children}</DesignSystemProvider>;
 * }
 * ```
 */
export function DesignSystemProvider({
  children,
  errorFallback,
  onError,
}: DesignSystemProviderProps) {
  return (
    <ArchThemeProvider>
      <ErrorBoundary fallback={errorFallback} onError={onError}>
        {children}
      </ErrorBoundary>
    </ArchThemeProvider>
  )
}

export type { DesignSystemProviderProps }
