import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HourlyLoadsTable, type HourlyLoadRow } from './HourlyLoadsTable'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock Control Room Actions
jest.mock('../actions', () => ({
  updateHourlyLoad: jest.fn().mockResolvedValue({ success: true }),
  bookMachineBreakdown: jest.fn().mockResolvedValue({ success: true }),
  endHaulingSession: jest.fn().mockResolvedValue({ success: true }),
  updateMachineSite: jest.fn().mockResolvedValue({ success: true }),
  updateHourlyLoadMaterial: jest.fn().mockResolvedValue({ success: true }),
  reassignDumperExcavator: jest.fn().mockResolvedValue({ success: true }),
}))

describe('HourlyLoadsTable Component', () => {
  const mockRows: HourlyLoadRow[] = [
    {
      id: 'row-1',
      created_at: '2026-08-04T06:00:00Z',
      load_date: '2026-08-04',
      shift_type: 'day',
      material_type: 'Coal',
      hour_01: 5,
      hour_02: 8,
      hour_03: 0,
      hour_04: 10,
      hour_05: 4,
      hour_06: 6,
      hour_07: 7,
      hour_08: 9,
      hour_09: 3,
      hour_10: 2,
      hour_11: 4,
      hour_12: 5,
      total_loads: 63,
      machines: [
        {
          id: 'mach-1',
          name: 'Haul Truck 101',
          machine_type: 'Dumper',
          bin_factor: 50,
          site: [{ id: 'site-1', name: 'Pit Alpha' }],
          assignments: [],
        },
      ],
    },
  ]

  const mockSites = [{ id: 'site-1', name: 'Pit Alpha' }]
  const mockExcavators = [
    { id: 'exc-1', name: 'Excavator 01', machine_type: 'Excavator', site_id: 'site-1' },
  ]

  it('renders machine details and hourly load values correctly', () => {
    render(
      <HourlyLoadsTable initialLoads={mockRows} sites={mockSites} excavators={mockExcavators} />
    )

    expect(screen.getByText('Haul Truck 101')).toBeInTheDocument()
    expect(screen.getByText('Pit Alpha')).toBeInTheDocument()
  })

  it('calculates totals and renders shift metrics', () => {
    render(
      <HourlyLoadsTable initialLoads={mockRows} sites={mockSites} excavators={mockExcavators} />
    )

    expect(screen.getAllByText('63').length).toBeGreaterThan(0)
  })

  it('renders correctly with empty initialLoads', () => {
    render(<HourlyLoadsTable initialLoads={[]} sites={mockSites} excavators={mockExcavators} />)

    expect(screen.getByText(/no loads recorded for today/i)).toBeInTheDocument()
  })
})
