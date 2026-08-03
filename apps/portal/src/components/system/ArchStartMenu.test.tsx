import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ArchStartMenu } from './ArchStartMenu'
import { ARCH_LOCK_EVENT, ArchLockOverlay } from './ArchLockOverlay'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('ArchStartMenu', () => {
  it('renders pinned apps and all-apps entries', () => {
    render(<ArchStartMenu onClose={jest.fn()} />)
    expect(screen.getByTestId('arch-start-menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Hub/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Drilling/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Control Room/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Production/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Sign out/i })).toBeInTheDocument()
  })

  it('filters apps by search query', () => {
    render(<ArchStartMenu onClose={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Search Arch'), {
      target: { value: 'drill' },
    })
    expect(screen.getByRole('menuitem', { name: /Drilling/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Production/i })).not.toBeInTheDocument()
  })

  it('calls onClose when activating a pinned link', () => {
    const onClose = jest.fn()
    render(<ArchStartMenu onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: /Hub/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('dispatches command palette event', () => {
    const onClose = jest.fn()
    const spy = jest.fn()
    window.addEventListener('arch-open-command-bar', spy)
    render(<ArchStartMenu onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: /Command palette/i }))
    expect(onClose).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
    window.removeEventListener('arch-open-command-bar', spy)
  })

  it('dispatches lock event', () => {
    const onClose = jest.fn()
    const spy = jest.fn()
    window.addEventListener(ARCH_LOCK_EVENT, spy)
    render(<ArchStartMenu onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: /Lock screen/i }))
    expect(onClose).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
    window.removeEventListener(ARCH_LOCK_EVENT, spy)
  })
})

describe('ArchLockOverlay', () => {
  it('shows overlay when lock event fires', () => {
    render(<ArchLockOverlay />)
    expect(screen.queryByTestId('arch-lock-overlay')).not.toBeInTheDocument()
    fireEvent(window, new CustomEvent(ARCH_LOCK_EVENT))
    expect(screen.getByTestId('arch-lock-overlay')).toBeInTheDocument()
  })
})
