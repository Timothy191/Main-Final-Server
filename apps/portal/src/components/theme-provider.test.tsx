import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { ArchThemeProvider, useTheme } from '@repo/theme/react'
import '@testing-library/jest-dom'

// Test component to consume the theme hook
function ThemeTestConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button data-testid="set-hg-btn" onClick={() => setTheme('high-glare')}>
        Set High Glare
      </button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  )
}

describe('ArchThemeProvider and useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders children and provides default light theme', () => {
    render(
      <ArchThemeProvider>
        <ThemeTestConsumer />
      </ArchThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('saves theme to localStorage and sets HTML attribute on setTheme', async () => {
    render(
      <ArchThemeProvider>
        <ThemeTestConsumer />
      </ArchThemeProvider>
    )

    const setHgBtn = screen.getByTestId('set-hg-btn')

    await act(async () => {
      setHgBtn.click()
    })

    expect(screen.getByTestId('theme-val')).toHaveTextContent('high-glare')
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-glare')
    expect(localStorage.getItem('theme')).toBe('high-glare')

    const setLightBtn = screen.getByTestId('set-light-btn')

    await act(async () => {
      setLightBtn.click()
    })

    expect(screen.getByTestId('theme-val')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('toggles theme correctly via toggleTheme', async () => {
    render(
      <ArchThemeProvider>
        <ThemeTestConsumer />
      </ArchThemeProvider>
    )

    const toggleBtn = screen.getByTestId('toggle-btn')

    // Initial state is light, toggle should make it high-glare
    await act(async () => {
      toggleBtn.click()
    })
    expect(screen.getByTestId('theme-val')).toHaveTextContent('high-glare')
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-glare')

    // Toggle again should return to light
    await act(async () => {
      toggleBtn.click()
    })
    expect(screen.getByTestId('theme-val')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('initializes theme from localStorage value on mount', () => {
    localStorage.setItem('theme', 'high-glare')

    render(
      <ArchThemeProvider>
        <ThemeTestConsumer />
      </ArchThemeProvider>
    )

    expect(screen.getByTestId('theme-val')).toHaveTextContent('high-glare')
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-glare')
  })
})
