'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeType = 'light' | 'dark' | 'high-glare'

interface ArchThemeContextType {
  theme: ThemeType
  resolvedTheme: ThemeType
  setTheme: (theme: ThemeType) => void
  toggleTheme: () => void
}

const ArchThemeContext = createContext<ArchThemeContextType | undefined>(undefined)

/**
 * ArchThemeProvider — Theme provider for the Arch System supporting High-Glare Industrial mode.
 */
export function ArchThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)

      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', savedTheme === 'dark' ? '#000000' : '#ffffff')
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.style.colorScheme = 'light'
    }
  }, [])

  const handleSetTheme = (newTheme: ThemeType) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)

    if (newTheme === 'dark') {
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.style.colorScheme = 'light'
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#000000' : '#ffffff')
    }
  }

  const toggleTheme = () => {
    const nextTheme: ThemeType = theme === 'light' ? 'high-glare' : 'light'
    handleSetTheme(nextTheme)
  }

  return (
    <ArchThemeContext.Provider
      value={{
        theme,
        resolvedTheme: theme,
        setTheme: handleSetTheme,
        toggleTheme,
      }}
    >
      {children}
    </ArchThemeContext.Provider>
  )
}

export function useArchTheme() {
  const ctx = useContext(ArchThemeContext)
  if (!ctx) {
    throw new Error('useArchTheme must be used within an ArchThemeProvider')
  }
  return ctx
}

export function useTheme() {
  return useArchTheme()
}
