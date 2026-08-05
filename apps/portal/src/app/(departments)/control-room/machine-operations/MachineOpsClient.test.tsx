import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MachineOpsClient } from './MachineOpsClient'
import type { MachineOperationSmrRow } from '../actions'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock Control Room Actions
jest.mock('../actions', () => ({
  upsertMachineOperation: jest.fn().mockResolvedValue({ success: true }),
  closeMachineOperation: jest.fn().mockResolvedValue({ success: true }),
}))

describe('MachineOpsClient Component', () => {
  const mockRow: MachineOperationSmrRow = {
    id: 'op-1',
    machineId: 'mach-1',
    machineName: 'Excavator 01',
    machineType: 'Excavator',
    shiftDate: '2026-08-04',
    shiftType: 'day',
    startSMR: 1000,
    closeSMR: null,
    smrTotal: 8.5,
    startTime: null,
    endTime: null,
    siteId: 'site-1',
    siteName: 'Pit Alpha',
    operatorId: 'op-user-1',
    operatorName: 'John Doe',
    naturalDelayMinutes: 15,
    nonProductionDelayMinutes: 30,
    productionDelayMinutes: 0,
    engineeringDelayMinutes: 45,
    utilizationPct: 82.5,
    availabilityPct: 91.0,
  }

  const mockSites = [{ id: 'site-1', name: 'Pit Alpha' }]
  const mockOperators = [{ id: 'op-user-1', fullName: 'John Doe' }]

  it('renders ShiftSelector with date and shift controls', () => {
    render(<MachineOpsClient.ShiftSelector shiftDate="2026-08-04" shiftType="day" />)

    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-08-04')).toBeInTheDocument()
  })

  it('renders Row component with machine operation SMR data', () => {
    render(
      <table>
        <tbody>
          <MachineOpsClient.Row row={mockRow} sites={mockSites} operators={mockOperators} />
        </tbody>
      </table>
    )

    expect(screen.getByText('Excavator 01')).toBeInTheDocument()
    expect(screen.getByText('1000.00')).toBeInTheDocument()
  })
})
