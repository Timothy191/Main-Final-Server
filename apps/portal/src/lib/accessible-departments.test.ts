import { departmentsForHub } from './accessible-departments'
import { DEPARTMENTS } from './departments'

jest.mock('server-only', () => ({}))

describe('departmentsForHub', () => {
  it('always returns the full catalog', () => {
    const result = departmentsForHub([], 'operator')
    expect(result).toHaveLength(DEPARTMENTS.length)
    expect(result.every((d) => d.accessible === false)).toBe(true)
  })

  it('marks ACL departments accessible when role allows', () => {
    const result = departmentsForHub(['drilling', 'production'], 'operator')
    expect(result.find((d) => d.name === 'drilling')?.accessible).toBe(true)
    expect(result.find((d) => d.name === 'production')?.accessible).toBe(true)
    expect(result.find((d) => d.name === 'safety')?.accessible).toBe(false)
  })

  it('locks role-restricted departments for non-admin roles', () => {
    const result = departmentsForHub(['access-control', 'control-room'], 'operator')
    expect(result.find((d) => d.name === 'access-control')?.accessible).toBe(false)
    expect(result.find((d) => d.name === 'control-room')?.accessible).toBe(false)
  })

  it('unlocks role-restricted departments for admin when ACL includes them', () => {
    const result = departmentsForHub(['access-control', 'control-room'], 'admin')
    expect(result.find((d) => d.name === 'access-control')?.accessible).toBe(true)
    expect(result.find((d) => d.name === 'control-room')?.accessible).toBe(true)
  })
})
