import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ServicesDropdown } from './ServicesDropdown'

jest.mock('@/lib/weather-api', () => ({
  fetchWeather: jest.fn(() =>
    Promise.resolve({
      temperature: 24,
      feelsLike: 26,
      humidity: 62,
      windSpeed: 14,
      windDirection: 135,
      weatherCode: 2,
      description: 'Partly cloudy',
      icon: '⛅',
      timestamp: new Date().toISOString(),
      location: { lat: -26.35914, lon: 28.79267, name: 'Delmas, Mpumalanga' },
    })
  ),
  getWindDirection: jest.fn((deg: number) => {
    const dirs = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ]
    return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16] ?? 'N'
  }),
}))

describe('ServicesDropdown', () => {
  beforeEach(() => {
    // Clear persisted widget position
    window.localStorage.removeItem('arch-services-pos')
    // Seed safety alerts in localStorage
    window.localStorage.setItem(
      'arch-safety-alerts',
      JSON.stringify([
        {
          id: 'sa-1',
          severity: 'warning',
          message: 'High dust levels — Pit B',
          timestamp: Date.now() - 3600000,
        },
        {
          id: 'sa-2',
          severity: 'info',
          message: 'Blasting hold lifted — Sector 4',
          timestamp: Date.now() - 7200000,
        },
      ])
    )
  })

  afterEach(() => {
    window.localStorage.removeItem('arch-safety-alerts')
    window.localStorage.removeItem('arch-services-pos')
  })

  const renderDropdown = async () => {
    await act(async () => {
      render(<ServicesDropdown />)
      // Flush microtasks/promises so fetchWeather resolves and state updates commit
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }

  it('renders system tray trigger icon and is closed by default', async () => {
    await renderDropdown()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('toggles dropdown on click', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button')
    await act(async () => {
      fireEvent.click(trigger)
    })
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('closes on Escape and on outside click', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })

    // Escape closes
    await act(async () => {
      fireEvent.click(trigger)
    })
    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())

    // Outside mousedown closes
    await act(async () => {
      fireEvent.click(trigger)
    })
    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
    await act(async () => {
      fireEvent.mouseDown(document.body)
    })
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('renders environmental and operations status when open', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    await act(async () => {
      fireEvent.click(trigger)
    })

    await waitFor(() => {
      // Weather
      expect(screen.getByText('24°C')).toBeInTheDocument()
      expect(screen.getByText('Partly cloudy')).toBeInTheDocument()

      // Shift
      expect(screen.getByText(/Shift$/)).toBeInTheDocument() // Day or Night Shift
      expect(screen.getByText(/\d+h remaining/)).toBeInTheDocument()

      // Wind
      expect(screen.getByText('14 km/h')).toBeInTheDocument()
      expect(screen.getByText('Visibility OK')).toBeInTheDocument()

      // Safety alerts
      expect(screen.getByText(/2 active alerts/)).toBeInTheDocument()
    })
  })

  it('renders power options when open', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    await act(async () => {
      fireEvent.click(trigger)
    })

    await waitFor(() => {
      expect(screen.getByText('Lock Screen')).toBeInTheDocument()
      expect(screen.getByText('Sleep')).toBeInTheDocument()
      expect(screen.getByText('Log Out')).toBeInTheDocument()
      expect(screen.getByText('Restart…')).toBeInTheDocument()
      expect(screen.getByText('Shut Down…')).toBeInTheDocument()
    })
  })

  it('shows lock screen overlay and dismisses on click', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    await act(async () => {
      fireEvent.click(trigger)
    })

    const lockItem = screen.getByText('Lock Screen')
    await act(async () => {
      fireEvent.click(lockItem)
    })

    await waitFor(() => {
      expect(screen.getByText('Click anywhere to unlock')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Click anywhere to unlock'))
    })
    await waitFor(() => {
      expect(screen.queryByText('Click anywhere to unlock')).not.toBeInTheDocument()
    })
  })

  it('contains logout form', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    await act(async () => {
      fireEvent.click(trigger)
    })

    const logoutButton = screen.getByText('Log Out')
    expect(logoutButton.closest('form')).toBeInTheDocument()
  })

  it('shows shut down overlay', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    await act(async () => {
      fireEvent.click(trigger)
    })

    const shutDownItem = screen.getByText('Shut Down…')
    await act(async () => {
      fireEvent.click(shutDownItem)
    })

    await waitFor(() => {
      expect(screen.getByText('It is now safe to turn off your computer.')).toBeInTheDocument()
    })
  })

  it('renders quick actions when open', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    await act(async () => {
      fireEvent.click(trigger)
    })

    await waitFor(() => {
      expect(screen.getByText('Reload')).toBeInTheDocument()
      expect(screen.getByText('Fullscreen')).toBeInTheDocument()
      expect(screen.getByText('Daily Safety Log')).toBeInTheDocument()
      expect(screen.getByText('Safety Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Emergency Line')).toBeInTheDocument()
    })
  })

  it('toggles dropdown on Alt+S keyboard shortcut', async () => {
    await renderDropdown()
    const trigger = screen.getByRole('button', { name: /system tray/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // Open
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', altKey: true })
    })
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    // Close
    await act(async () => {
      fireEvent.keyDown(window, { key: 's', altKey: true })
    })
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
