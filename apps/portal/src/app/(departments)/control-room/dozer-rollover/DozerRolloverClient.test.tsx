import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DozerRolloverClient, type DozerRolloverRecord } from './DozerRolloverClient'

describe('DozerRolloverClient Component', () => {
  const mockRecords: DozerRolloverRecord[] = [
    {
      id: 'dz-1',
      machineId: 'm-dz1',
      machineName: 'Dozer D10T-01',
      siteName: 'Pit Alpha',
      operatorName: 'Michael Scott',
      shiftDate: '2026-08-04',
      shiftType: 'day',
      startSMR: 1000.0,
      closeSMR: 1010.0,
      hoursWorked: 10.0, // 10 hours * 250 = 2,500 BCM
      comment: 'Main bench rollover',
    },
    {
      id: 'dz-2',
      machineId: 'm-dz2',
      machineName: 'Dozer D11T-02',
      siteName: 'Pit Beta',
      operatorName: 'Dwight Schrute',
      shiftDate: '2026-08-04',
      shiftType: 'night',
      startSMR: 2000.0,
      closeSMR: 2005.0,
      hoursWorked: 5.0, // 5 hours * 250 = 1,250 BCM
      comment: 'Night rollover push',
    },
  ]

  it('renders dozer machine details and calculates rollover volume (Hours * 250)', () => {
    render(<DozerRolloverClient initialRecords={mockRecords} rolloverMultiplier={250} />)

    expect(screen.getByText('Dozer D10T-01')).toBeInTheDocument()
    expect(screen.getByText('Dozer D11T-02')).toBeInTheDocument()

    // 10h + 5h = 15h total => 15 * 250 = 3,750 BCM total KPI
    expect(screen.getByText(/3,750 BCM/i)).toBeInTheDocument()

    // Individual rows: 10h * 250 = 2,500 BCM, 5h * 250 = 1,250 BCM
    expect(screen.getByText('2,500 BCM')).toBeInTheDocument()
    expect(screen.getByText('1,250 BCM')).toBeInTheDocument()
  })

  it('filters dozer records by search query', () => {
    render(<DozerRolloverClient initialRecords={mockRecords} rolloverMultiplier={250} />)

    const searchInput = screen.getByPlaceholderText(/search dozer, site, operator or comment/i)
    fireEvent.change(searchInput, { target: { value: 'Dwight' } })

    expect(screen.getByText('Dozer D11T-02')).toBeInTheDocument()
    expect(screen.queryByText('Dozer D10T-01')).not.toBeInTheDocument()
  })

  it('filters dozer records by shift type', () => {
    render(<DozerRolloverClient initialRecords={mockRecords} rolloverMultiplier={250} />)

    const shiftSelect = screen.getByRole('combobox')
    fireEvent.change(shiftSelect, { target: { value: 'night' } })

    expect(screen.getByText('Dozer D11T-02')).toBeInTheDocument()
    expect(screen.queryByText('Dozer D10T-01')).not.toBeInTheDocument()
  })
})
