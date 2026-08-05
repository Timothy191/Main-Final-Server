import React from 'react'
import { render, screen } from '@testing-library/react'
import { GlassTooltip } from '../index'
import '@testing-library/jest-dom'

describe('charts package', () => {
  it('GlassTooltip renders nothing when inactive', () => {
    const { container } = render(<GlassTooltip active={false} payload={[]} label="L1" />)
    expect(container.firstChild).toBeNull()
  })

  it('GlassTooltip renders payload values', () => {
    render(
      <GlassTooltip
        active
        payload={[
          { name: 'Drilling', value: 42, color: '#3b82f6' },
          { name: 'Production', value: 84, color: '#10b981' },
        ]}
        label="2026-08-05"
      />
    )
    expect(screen.getByText('2026-08-05')).toBeInTheDocument()
    expect(screen.getByText('Drilling:')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Production:')).toBeInTheDocument()
    expect(screen.getByText('84')).toBeInTheDocument()
  })
})
