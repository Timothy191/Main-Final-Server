import React from 'react'
import { render, screen } from '@testing-library/react'
import { GlassSurface } from '../ui/glass-surface'
import '@testing-library/jest-dom'

describe('GlassSurface', () => {
  it('renders children', () => {
    render(<GlassSurface>Surface Content</GlassSurface>)
    expect(screen.getByText('Surface Content')).toBeInTheDocument()
  })

  it('uses the provided dimensions', () => {
    const { container } = render(
      <GlassSurface width={300} height={120}>
        Content
      </GlassSurface>
    )
    const surface = container.firstChild as HTMLElement
    expect(surface).toHaveStyle('width: 300px')
    expect(surface).toHaveStyle('height: 120px')
  })
})
