import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpotlightCard } from '../ui/spotlight-card'
import '@testing-library/jest-dom'

describe('SpotlightCard', () => {
  it('renders children', () => {
    render(<SpotlightCard>Hello World</SpotlightCard>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('applies custom spotlight color via CSS property', () => {
    const { container } = render(
      <SpotlightCard spotlightColor="rgba(255, 0, 0, 0.5)">Content</SpotlightCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveStyle('--spotlight-color: rgba(255, 0, 0, 0.5)')
  })

  it('updates mouse position on mouse move', () => {
    const { container } = render(<SpotlightCard>Content</SpotlightCard>)
    const card = container.firstChild as HTMLElement
    fireEvent.mouseMove(card, { clientX: 42, clientY: 84 })
    expect(card.style.getPropertyValue('--spotlight-x')).toMatch(/px$/)
    expect(card.style.getPropertyValue('--spotlight-y')).toMatch(/px$/)
  })
})
