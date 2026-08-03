import React from 'react'
import { render, screen } from '@testing-library/react'
import { HeroRotator } from './HeroRotator'
import type { Department } from '@/lib/departments'

const lockedDept: Department & { accessible: boolean } = {
  name: 'control-room',
  displayName: 'Control Room',
  description: 'Live ops',
  icon: 'Monitor',
  color: 'blue',
  type: 'control_room',
  accessible: false,
}

const openDept: Department & { accessible: boolean } = {
  name: 'drilling',
  displayName: 'Drilling',
  description: 'Drill ops',
  icon: 'Drill',
  color: 'blue',
  type: 'standard',
  accessible: true,
  actions: [{ label: 'Logs', href: '/drilling/drilling-operations' }],
}

describe('HeroRotator', () => {
  it('renders locked department CTAs without links', () => {
    render(
      <HeroRotator
        defaultTitle="Portal"
        defaultDescription="Desc"
        primaryHref="/hub"
        primaryLabel="Home"
        secondaryHref="/hub"
        secondaryLabel="Help"
        departments={[lockedDept]}
      />
    )
    expect(screen.getByRole('heading', { name: 'Control Room' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /go to control room/i })).not.toBeInTheDocument()
    expect(screen.getByText(/go to control room/i).closest("[aria-disabled='true']")).toBeTruthy()

    // Assert ARCH taskbar pill schema on hero CTAs
    const primaryLink = screen.getByRole('link', { name: 'Home' })
    const secondaryLink = screen.getByRole('link', { name: 'Help' })
    expect(primaryLink.className).toContain('border-border-subtle')
    expect(primaryLink.className).toContain('bg-black/[0.03]')
    expect(secondaryLink.className).toContain('border-border-subtle')
    expect(secondaryLink.className).toContain('rounded-full')
  })

  it('renders open department CTAs as links', () => {
    render(
      <HeroRotator
        defaultTitle="Portal"
        defaultDescription="Desc"
        primaryHref="/hub"
        primaryLabel="Home"
        secondaryHref="/hub"
        secondaryLabel="Help"
        departments={[openDept]}
      />
    )
    expect(screen.getByRole('link', { name: /logs/i })).toHaveAttribute(
      'href',
      '/drilling/drilling-operations'
    )
  })
})
