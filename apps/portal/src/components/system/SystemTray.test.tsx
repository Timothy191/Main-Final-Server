import { render, screen, fireEvent } from '@testing-library/react'
import {
  formatTimeSeconds,
  NetworkStatusRow,
  BatteryStatusRow,
  VolumeControlRow,
  NotificationRow,
  ServerHealthRow,
} from './SystemTray'

describe('formatTimeSeconds', () => {
  it("returns 'Calculating…' for non-finite or non-positive values", () => {
    expect(formatTimeSeconds(0)).toBe('Calculating…')
    expect(formatTimeSeconds(-1)).toBe('Calculating…')
    expect(formatTimeSeconds(NaN)).toBe('Calculating…')
    expect(formatTimeSeconds(Infinity)).toBe('Calculating…')
  })

  it('formats minutes only when under an hour', () => {
    expect(formatTimeSeconds(90)).toBe('1m')
    expect(formatTimeSeconds(3599)).toBe('59m')
  })

  it('formats hours and minutes when an hour or more', () => {
    expect(formatTimeSeconds(3661)).toBe('1h 1m')
    expect(formatTimeSeconds(7200)).toBe('2h 0m')
  })
})

describe('NetworkStatusRow', () => {
  it('renders online wifi state', () => {
    render(
      <NetworkStatusRow
        online={true}
        effectiveType="4g"
        connType="wifi"
        downlink={50}
        rtt={20}
        supported={true}
      />
    )
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('wifi')).toBeInTheDocument()
    expect(screen.getByText('50.0 Mbps')).toBeInTheDocument()
    expect(screen.getByText('20 ms')).toBeInTheDocument()
  })

  it('renders offline state', () => {
    render(
      <NetworkStatusRow
        online={false}
        effectiveType={undefined}
        connType={undefined}
        downlink={undefined}
        rtt={undefined}
        supported={true}
      />
    )
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('shows unsupported message', () => {
    render(
      <NetworkStatusRow
        online={true}
        effectiveType={undefined}
        connType={undefined}
        downlink={undefined}
        rtt={undefined}
        supported={false}
      />
    )
    expect(screen.getByText('Network API unavailable')).toBeInTheDocument()
  })
})

describe('BatteryStatusRow', () => {
  it('renders battery percentage and bar', () => {
    render(
      <BatteryStatusRow
        level={0.85}
        charging={false}
        chargingTime={Infinity}
        dischargingTime={3600}
        supported={true}
      />
    )
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('On Battery')).toBeInTheDocument()
  })

  it('shows charging state', () => {
    render(
      <BatteryStatusRow
        level={0.45}
        charging={true}
        chargingTime={1800}
        dischargingTime={Infinity}
        supported={true}
      />
    )
    expect(screen.getByText('Charging')).toBeInTheDocument()
    expect(screen.getByText('30m to full')).toBeInTheDocument()
  })

  it('shows unsupported state', () => {
    render(
      <BatteryStatusRow
        level={null}
        charging={false}
        chargingTime={Infinity}
        dischargingTime={Infinity}
        supported={false}
      />
    )
    expect(screen.getByText('Battery status unavailable')).toBeInTheDocument()
  })
})

describe('VolumeControlRow', () => {
  it('renders volume and calls adjust on change', () => {
    const adjust = jest.fn()
    render(<VolumeControlRow volume={75} muted={false} toggleMute={jest.fn()} adjust={adjust} />)
    expect(screen.getByText('75%')).toBeInTheDocument()

    const slider = screen.getByLabelText('Volume')
    fireEvent.change(slider, { target: { value: '50' } })
    expect(adjust).toHaveBeenCalledWith(50)
  })

  it('renders muted state', () => {
    const toggleMute = jest.fn()
    render(<VolumeControlRow volume={0} muted={true} toggleMute={toggleMute} adjust={jest.fn()} />)
    expect(screen.getByText('Muted')).toBeInTheDocument()

    const muteButton = screen.getByLabelText('Unmute')
    fireEvent.click(muteButton)
    expect(toggleMute).toHaveBeenCalled()
  })
})

describe('NotificationRow', () => {
  it('renders notification count and clear button', () => {
    const clear = jest.fn()
    render(<NotificationRow count={3} clear={clear} />)
    expect(screen.getByText('3 notifications')).toBeInTheDocument()

    const clearButton = screen.getByLabelText('Clear notifications')
    fireEvent.click(clearButton)
    expect(clear).toHaveBeenCalled()
  })

  it('renders empty state', () => {
    render(<NotificationRow count={0} clear={jest.fn()} />)
    expect(screen.getByText('No notifications')).toBeInTheDocument()
  })
})

describe('ServerHealthRow', () => {
  it('renders healthy state with all subsystems OK', () => {
    render(
      <ServerHealthRow
        status="healthy"
        db="ok"
        redis="ok"
        fuxa="ok"
        responseTime={42}
        loading={false}
      />
    )
    expect(screen.getByText('Server Health')).toBeInTheDocument()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.getByText('42ms')).toBeInTheDocument()
  })

  it('renders degraded state and highlights unavailable subsystem', () => {
    render(
      <ServerHealthRow
        status="degraded"
        db="ok"
        redis="unavailable"
        fuxa="disabled"
        responseTime={120}
        loading={false}
      />
    )
    expect(screen.getByText('Degraded')).toBeInTheDocument()
    expect(screen.getByText('Redis')).toBeInTheDocument()
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Disabled').length).toBeGreaterThanOrEqual(1)
  })

  it('renders error state and shows checking when loading', () => {
    render(
      <ServerHealthRow
        status="error"
        db="unavailable"
        redis="unavailable"
        fuxa="unavailable"
        responseTime={0}
        loading={true}
      />
    )
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Checking…')).toBeInTheDocument()
  })
})
