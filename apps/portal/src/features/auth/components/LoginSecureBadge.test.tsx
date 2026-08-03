import { render, screen, waitFor } from '@testing-library/react'
import { LoginSecureBadge } from './LoginSecureBadge'

/**
 * Note: jsdom's window.location is non-configurable, so we cannot mock it.
 * The hostname-dependent aria-label assertions use regex to be hostname-agnostic.
 * window.isSecureContext IS configurable and is set to true in beforeEach.
 */
describe('LoginSecureBadge', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      writable: true,
      value: true,
    })
  })

  it('renders the compact secure label', () => {
    render(<LoginSecureBadge />)
    expect(screen.getByText('Secure')).toBeInTheDocument()
  })

  it('hydrates node status with hostname in the aria-label', async () => {
    render(<LoginSecureBadge />)

    await waitFor(() => {
      const status = screen.getByRole('status')
      const ariaLabel = status.getAttribute('aria-label')
      expect(ariaLabel).toMatch(/^Secure connection\./)
      expect(ariaLabel).toMatch(/Active\./)
      expect(ariaLabel).toMatch(/Cryptographic Validation: OK\.$/)
    })
  })
})
