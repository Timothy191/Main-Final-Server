'use client'

import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react'

interface ArchThemeContextType {
  theme: 'light'
  resolvedTheme: 'light'
  setTheme: () => void
  toggleTheme: () => void
}

const ArchThemeContext = createContext<ArchThemeContextType | undefined>(undefined)

const LIGHT_THEME = {
  theme: 'light' as const,
  resolvedTheme: 'light' as const,
  setTheme: () => {},
  toggleTheme: () => {},
}

/**
 * ArchThemeProvider — Light-only theme provider for the Arch System.
 *
 * Sets `data-theme="light"` and `<meta name="theme-color">` on mount.
 * No dark mode; no next-themes dependency.
 */
export function ArchThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', 'light')
    root.style.colorScheme = 'light'

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff')
    }
  }, [])

  return <ArchThemeContext.Provider value={LIGHT_THEME}>{children}</ArchThemeContext.Provider>
}

export function useArchTheme() {
  const ctx = useContext(ArchThemeContext)
  if (!ctx) {
    throw new Error('useArchTheme must be used within an ArchThemeProvider')
  }
  return ctx
}

/** @deprecated use useArchTheme — light-only stub for legacy imports */
export function useTheme() {
  return useArchTheme()
}
