import React from 'react'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './BottomNav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/hub',
}))

describe('BottomNav', () => {
  it('keeps all department items visible when ACL is empty', () => {
    render(<BottomNav accessibleDepartments={[]} />)
    expect(screen.getByText('Drilling')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByText('Safety')).toBeInTheDocument()
    expect(screen.getByText('Control')).toBeInTheDocument()
  })

  it('marks locked departments with no-entry cursor and aria-disabled', () => {
    render(<BottomNav accessibleDepartments={['drilling']} />)
    const locked = screen.getByText('Safety').closest("[aria-disabled='true']")
    expect(locked).toBeTruthy()
    expect(locked?.className).toMatch(/cursor-not-allowed/)
    expect(screen.getByRole('link', { name: /drilling/i })).toBeInTheDocument()
  })

  it('fail-closes department items when accessibleDepartments is omitted', () => {
    render(<BottomNav />)
    expect(screen.getByText('Drilling').closest("[aria-disabled='true']")).toBeTruthy()
    expect(screen.getByRole('link', { name: /hub/i })).toBeInTheDocument()
  })
})
