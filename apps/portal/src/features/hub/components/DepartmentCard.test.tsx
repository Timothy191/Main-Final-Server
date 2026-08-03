import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DepartmentCard } from './DepartmentCard'
import { useRouter } from 'next/navigation'
import type { Department } from '@/lib/departments'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Sparkline to avoid rendering complexity
jest.mock('./Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}))

const mockDepartment: Department = {
  name: 'drilling',
  displayName: 'Drilling Operations',
  description: 'Core drilling operations telemetry and systems control.',
  icon: 'Drill',
  color: 'emerald',
  type: 'standard',
  gridSpan: 'col-span-1',
  status: 'active',
  stats: {
    label: 'Current Depth',
    value: '1,240 m',
  },
  trend: [10, 20, 15, 30, 25],
  actions: [
    { label: 'Daily Logs', href: '/drilling/daily-log' },
    { label: 'Telemetry', href: '/drilling/machine-telemetry' },
  ],
}

describe('DepartmentCard', () => {
  let mockPush: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders department information correctly', () => {
    render(<DepartmentCard department={mockDepartment} index={0} accessible />)
    expect(screen.getByText('Drilling Operations')).toBeInTheDocument()
    expect(
      screen.getByText('Core drilling operations telemetry and systems control.')
    ).toBeInTheDocument()
    expect(screen.getByText('1,240 m')).toBeInTheDocument()
    expect(screen.getByText('Daily Logs')).toBeInTheDocument()
  })

  it('triggers router push on click', () => {
    render(<DepartmentCard department={mockDepartment} index={0} accessible />)
    const card = screen.getByText('Drilling Operations').closest('.interactive-element')
    expect(card).toBeInTheDocument()
    if (card) {
      fireEvent.click(card)
    }
    expect(mockPush).toHaveBeenCalledWith('/drilling')
  })

  it('triggers router push on Enter keydown', () => {
    render(<DepartmentCard department={mockDepartment} index={0} accessible />)
    const card = screen.getByText('Drilling Operations').closest('.interactive-element')
    expect(card).toBeInTheDocument()
    if (card) {
      fireEvent.keyDown(card, { key: 'Enter' })
    }
    expect(mockPush).toHaveBeenCalledWith('/drilling')
  })

  it('triggers router push on Space keydown', () => {
    render(<DepartmentCard department={mockDepartment} index={0} accessible />)
    const card = screen.getByText('Drilling Operations').closest('.interactive-element')
    expect(card).toBeInTheDocument()
    if (card) {
      fireEvent.keyDown(card, { key: ' ' })
    }
    expect(mockPush).toHaveBeenCalledWith('/drilling')
  })

  it('applies tabIndex=0 to the outer interactive wrapper', () => {
    render(<DepartmentCard department={mockDepartment} index={0} accessible />)
    const card = screen.getByText('Drilling Operations').closest('.interactive-element')
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('defaults to locked when accessible prop is omitted', () => {
    render(<DepartmentCard department={mockDepartment} index={0} />)
    const card = screen.getByRole('link', { name: /no access/i })
    expect(card).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(card)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not navigate when accessible is false and uses no-entry cursor', () => {
    render(<DepartmentCard department={mockDepartment} index={0} accessible={false} />)
    const card = screen.getByRole('link', { name: /no access/i })
    expect(card).toHaveAttribute('aria-disabled', 'true')
    expect(card.className).toMatch(/cursor-not-allowed/)
    fireEvent.click(card)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
