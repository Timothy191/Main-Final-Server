/**
 * Tests for the ExcavatorActivityBuilder (site -> excavator -> data table flow).
 */

import { render, screen, fireEvent } from '@testing-library/react'
import {
  ExcavatorActivityBuilder,
  type BuilderSite,
  type BuilderMachine,
  type BuilderActivity,
} from './ExcavatorActivityBuilder'

jest.mock('@repo/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}))

jest.mock('@repo/ui/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}))

jest.mock('@repo/ui/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}))

jest.mock('lucide-react', () => ({
  Shovel: () => <span data-testid="icon-shovel" />,
  Plus: () => <span data-testid="icon-plus" />,
  Trash2: () => <span data-testid="icon-trash" />,
  MapPin: () => <span data-testid="icon-pin" />,
}))

const sites: BuilderSite[] = [
  { id: 's1', name: 'Site A' },
  { id: 's2', name: 'Site B' },
]

const machines: BuilderMachine[] = [
  {
    id: 'm1',
    name: 'EX-01',
    machine_type: 'Excavator',
    serial_number: 'SN-1',
    bin_factor: 18.5,
    site_id: 's1',
  },
  {
    id: 'm2',
    name: 'SH-01',
    machine_type: 'Shovel',
    serial_number: 'SN-2',
    bin_factor: 20,
    site_id: 's1',
  },
  {
    id: 'm3',
    name: 'EX-02',
    machine_type: 'Excavator',
    serial_number: 'SN-3',
    bin_factor: 19,
    site_id: 's2',
  },
]

const activities: BuilderActivity[] = [
  {
    id: 'a1',
    activity_date: '2026-08-04',
    shift_type: 'day',
    loads: 40,
    passes: 80,
    material_type: 'Coal',
    estimated_tonnes: 740,
    machine_id: 'm1',
    site_id: 's1',
    operator: 'John',
  },
  {
    id: 'a2',
    activity_date: '2026-08-03',
    shift_type: 'night',
    loads: 30,
    passes: 60,
    material_type: 'Waste',
    estimated_tonnes: 555,
    machine_id: 'm1',
    site_id: 's1',
    operator: 'Jane',
  },
]

const hoursByMachine: Record<string, number> = { m1: 8.5 }

function renderBuilder() {
  return render(
    <ExcavatorActivityBuilder
      sites={sites}
      machines={machines}
      activities={activities}
      hoursByMachine={hoursByMachine}
    />
  )
}

describe('ExcavatorActivityBuilder', () => {
  it('starts empty with only an Add Excavator button', () => {
    renderBuilder()
    expect(screen.getByText('Add Excavator')).toBeInTheDocument()
    expect(screen.queryByLabelText('Select site')).not.toBeInTheDocument()
  })

  it('adds a section with a site selector when Add Excavator is clicked', () => {
    renderBuilder()
    fireEvent.click(screen.getByText('Add Excavator'))
    expect(screen.getByLabelText('Select site')).toBeInTheDocument()
    // Step 2 excavator selector should not appear until a site is chosen.
    expect(screen.queryByLabelText('Select excavator')).not.toBeInTheDocument()
  })

  it('reveals the excavator selector filtered by the chosen site', () => {
    renderBuilder()
    fireEvent.click(screen.getByText('Add Excavator'))
    fireEvent.change(screen.getByLabelText('Select site'), { target: { value: 's1' } })

    const excavatorSelect = screen.getByLabelText('Select excavator') as HTMLSelectElement
    expect(excavatorSelect).toBeInTheDocument()
    // Only excavators belonging to site s1 should be present.
    const options = Array.from(excavatorSelect.options).map((o) => o.textContent)
    expect(options.some((t) => t?.includes('EX-01'))).toBe(true)
    expect(options.some((t) => t?.includes('SH-01'))).toBe(true)
    // m3 belongs to site B — should be filtered out.
    expect(options.some((t) => t?.includes('EX-02'))).toBe(false)
  })

  it('shows the data table with computed metrics once an excavator with prior data is selected', () => {
    renderBuilder()
    fireEvent.click(screen.getByText('Add Excavator'))
    fireEvent.change(screen.getByLabelText('Select site'), { target: { value: 's1' } })
    fireEvent.change(screen.getByLabelText('Select excavator'), { target: { value: 'm1' } })

    // Headers
    expect(screen.getByText('Machine ID')).toBeInTheDocument()
    expect(screen.getByText('Operator')).toBeInTheDocument()
    expect(screen.getByText('Hours Worked')).toBeInTheDocument()
    expect(screen.getByText('Total Loads')).toBeInTheDocument()
    expect(screen.getByText('Material')).toBeInTheDocument()
    expect(screen.getByText('Bin Factor')).toBeInTheDocument()
    expect(screen.getByText('Total Material Moved')).toBeInTheDocument()

    // Machine id + serial
    expect(screen.getByText('EX-01')).toBeInTheDocument()
    // Operator = newest activity (2026-08-04 -> John)
    expect(screen.getByText('John')).toBeInTheDocument()
    // Hours Worked from machine_hours
    expect(screen.getByText('8.5h')).toBeInTheDocument()
    // Total loads = 40 + 30 = 70
    expect(screen.getByText('70')).toBeInTheDocument()
    // Material = newest (Coal)
    expect(screen.getByText('Coal')).toBeInTheDocument()
    // Bin factor = 18.5 (1 decimal)
    expect(screen.getByText('18.5')).toBeInTheDocument()
    // Total Material Moved = 70 * 18.5 = 1295 (formatted with thousands separator)
    expect(screen.getByText('1,295 t')).toBeInTheDocument()
  })

  it('supports adding a second independent section', () => {
    renderBuilder()
    fireEvent.click(screen.getByText('Add Excavator'))
    fireEvent.click(screen.getByText('Add Excavator'))
    expect(screen.getAllByLabelText('Select site')).toHaveLength(2)
  })
})
