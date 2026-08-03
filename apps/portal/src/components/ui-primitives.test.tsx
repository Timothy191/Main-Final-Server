import { render, screen, fireEvent } from '@testing-library/react'
import { Avatar, Kbd, Spinner } from '@repo/ui'

describe('UI Primitives — Avatar', () => {
  it('renders fallback text when no src image is provided', () => {
    render(<Avatar fallback="JD" alt="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders image when valid src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User Profile" />)
    const img = screen.getByRole('img', { name: 'User Profile' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('falls back to initials on image load error', () => {
    render(<Avatar src="https://example.com/broken.jpg" alt="Jane Smith" />)
    const img = screen.getByRole('img', { name: 'Jane Smith' })
    fireEvent.error(img)
    expect(screen.getByText('JA')).toBeInTheDocument()
  })
})

describe('UI Primitives — Kbd', () => {
  it('renders shortcut key content inside kbd tag', () => {
    render(<Kbd>⌘K</Kbd>)
    const kbd = screen.getByText('⌘K')
    expect(kbd.tagName).toBe('KBD')
    expect(kbd).toHaveClass('font-mono')
  })

  it('applies custom class names', () => {
    render(<Kbd className="custom-kbd-class">Shift</Kbd>)
    const kbd = screen.getByText('Shift')
    expect(kbd).toHaveClass('custom-kbd-class')
  })
})

describe('UI Primitives — Spinner', () => {
  it('renders animated SVG spinner element', () => {
    const { container } = render(<Spinner size="md" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('animate-spin')
  })

  it('applies correct size styling classes', () => {
    const { container } = render(<Spinner size="lg" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('h-8')
    expect(svg).toHaveClass('w-8')
  })
})
