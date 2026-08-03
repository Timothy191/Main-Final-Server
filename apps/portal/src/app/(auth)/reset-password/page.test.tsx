import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ResetPasswordPage from './page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

jest.mock('@repo/supabase/client', () => ({
  createBrowserSupabaseClient: jest.fn(),
}))

jest.mock('@repo/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

jest.mock('@repo/ui/AnimatedButton', () => ({
  AnimatedButton: ({
    children,
    disabled,
    className,
    type,
    onClick,
  }: {
    children: React.ReactNode
    disabled?: boolean
    className?: string
    type?: 'button' | 'submit' | 'reset'
    onClick?: React.MouseEventHandler<HTMLButtonElement>
  }) => (
    <button type={type} disabled={disabled} className={className} onClick={onClick}>
      {children}
    </button>
  ),
}))

const { createBrowserSupabaseClient } = jest.requireMock('@repo/supabase/client')

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form elements successfully', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument()
    expect(screen.getByText('Back to Sign In')).toBeInTheDocument()
  })

  it('submits the form successfully and shows checks your email content', async () => {
    const mockReset = jest.fn().mockResolvedValue({ error: null })
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        resetPasswordForEmail: mockReset,
      },
    })

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@arch.os' },
    })

    fireEvent.submit(screen.getByLabelText('Email').closest('form')!)

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith('test@arch.os', {
        redirectTo: 'http://localhost/update-password',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
      expect(screen.getByText('test@arch.os')).toBeInTheDocument()
    })
  })

  it('maps rate limit error correctly', async () => {
    const mockReset = jest.fn().mockResolvedValue({
      error: { message: 'rate limit exceeded for email requests' },
    })
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        resetPasswordForEmail: mockReset,
      },
    })

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@arch.os' },
    })

    fireEvent.submit(screen.getByLabelText('Email').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Too many requests. Please wait a moment.')).toBeInTheDocument()
    })
  })

  it('maps invalid email error correctly', async () => {
    const mockReset = jest.fn().mockResolvedValue({
      error: { message: 'invalid email format' },
    })
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        resetPasswordForEmail: mockReset,
      },
    })

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })

    fireEvent.submit(screen.getByLabelText('Email').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    })
  })

  it('maps generic error correctly', async () => {
    const mockReset = jest.fn().mockResolvedValue({
      error: { message: 'Some database exception' },
    })
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        resetPasswordForEmail: mockReset,
      },
    })

    render(<ResetPasswordPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@arch.os' },
    })

    fireEvent.submit(screen.getByLabelText('Email').closest('form')!)

    await waitFor(() => {
      expect(
        screen.getByText('Unable to send reset email. Please try again or contact IT Support.')
      ).toBeInTheDocument()
    })
  })
})
