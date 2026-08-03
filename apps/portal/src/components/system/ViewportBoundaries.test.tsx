import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ViewportBoundaries } from './ViewportBoundaries'
import { useSystemMetrics } from '@/hooks/useSystemMetrics'
import { useSplitWindow } from '@/hooks/useSplitWindow'

jest.mock('next/navigation', () => ({
  usePathname: () => '/hub',
}))

jest.mock('@/hooks/useSystemMetrics')
jest.mock('@/hooks/useSplitWindow')

describe('ViewportBoundaries component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(useSystemMetrics as jest.Mock).mockReturnValue({
      websocketLatency: 25,
      serverTimeSAST: '09:30:15',
      currentShift: {
        shift: 'A',
        label: 'Shift A',
        start: '06:00',
        end: '14:00',
      },
      online: true,
    })
    ;(useSplitWindow as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ isOpen: false })
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders peeker and unified-dock with app buttons and system metrics', () => {
    render(<ViewportBoundaries />)
    const dock = screen.getByTestId('unified-dock')
    const peeker = screen.getByTestId('dock-peeker')

    expect(dock).toBeInTheDocument()
    expect(peeker).toBeInTheDocument()
    expect(dock.className).toContain('os-shell')
    expect(dock.className).toContain('os-shell--dock')
    expect(screen.getByText('09:30:15')).toBeInTheDocument()
    expect(screen.getByText('Shift A')).toBeInTheDocument()
    expect(screen.getByText('25 ms')).toBeInTheDocument()

    expect(screen.getByText('Hub')).toBeInTheDocument()
    expect(screen.getByText('Drilling')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('starts with the dock hidden by default', () => {
    render(<ViewportBoundaries />)
    const dock = screen.getByTestId('unified-dock')
    expect(dock).toHaveAttribute('data-state', 'hidden')
    expect(dock).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('dock-peeker')).toHaveAttribute('aria-expanded', 'false')
  })

  it('reveals the dock when the peeker is hovered', () => {
    render(<ViewportBoundaries />)
    const peeker = screen.getByTestId('dock-peeker')

    fireEvent.pointerEnter(peeker.parentElement as HTMLElement)

    const dock = screen.getByTestId('unified-dock')
    expect(dock).toHaveAttribute('data-state', 'revealed')
    expect(dock).toHaveAttribute('aria-hidden', 'false')
    expect(peeker).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles the dock when the peeker is clicked', () => {
    render(<ViewportBoundaries />)
    const peeker = screen.getByTestId('dock-peeker')
    const dock = screen.getByTestId('unified-dock')

    fireEvent.click(peeker)
    expect(dock).toHaveAttribute('data-state', 'revealed')

    fireEvent.click(peeker)
    expect(dock).toHaveAttribute('data-state', 'hidden')
  })

  it('re-hides the dock after pointer leave delay', () => {
    render(<ViewportBoundaries />)
    const shell = screen.getByTestId('dock-peeker').parentElement as HTMLElement
    const dock = screen.getByTestId('unified-dock')

    fireEvent.pointerEnter(shell)
    expect(dock).toHaveAttribute('data-state', 'revealed')

    fireEvent.pointerLeave(shell)
    expect(dock).toHaveAttribute('data-state', 'revealed')

    act(() => {
      jest.advanceTimersByTime(280)
    })

    expect(dock).toHaveAttribute('data-state', 'hidden')
  })

  it('keeps the dock open after peeker click even when pointer leaves', () => {
    render(<ViewportBoundaries />)
    const peeker = screen.getByTestId('dock-peeker')
    const shell = peeker.parentElement as HTMLElement
    const dock = screen.getByTestId('unified-dock')

    fireEvent.click(peeker)
    expect(dock).toHaveAttribute('data-state', 'revealed')

    fireEvent.pointerLeave(shell)
    act(() => {
      jest.advanceTimersByTime(280)
    })

    expect(dock).toHaveAttribute('data-state', 'revealed')
  })

  it('hides the dock on Escape', () => {
    render(<ViewportBoundaries />)
    const peeker = screen.getByTestId('dock-peeker')
    const dock = screen.getByTestId('unified-dock')

    fireEvent.click(peeker)
    expect(dock).toHaveAttribute('data-state', 'revealed')

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    expect(dock).toHaveAttribute('data-state', 'hidden')
  })

  it('reveals the dock when the hot-zone is entered', () => {
    render(<ViewportBoundaries />)
    const hotZone = screen.getByTestId('dock-hot-zone')
    const dock = screen.getByTestId('unified-dock')

    fireEvent.pointerEnter(hotZone)
    expect(dock).toHaveAttribute('data-state', 'revealed')
  })

  it('should not apply split shift class when split window is closed', () => {
    render(<ViewportBoundaries />)
    const dock = screen.getByTestId('unified-dock')
    expect(dock.className).not.toContain('sm:-translate-x-[calc(50%+200px)]')
  })

  it('should apply split shift class when split window is open', () => {
    ;(useSplitWindow as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ isOpen: true })
    )
    render(<ViewportBoundaries />)
    const dock = screen.getByTestId('unified-dock')
    expect(dock.className).toContain('sm:-translate-x-[calc(50%+200px)]')
  })
})
