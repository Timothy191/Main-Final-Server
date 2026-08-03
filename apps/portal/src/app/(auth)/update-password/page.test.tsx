import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import UpdatePasswordPage from './page'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
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

describe('UpdatePasswordPage', () => {
  let mockGetSession: jest.Mock
  let mockUpdateUser: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } })
    mockUpdateUser = jest.fn().mockResolvedValue({ error: null })

    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        getSession: mockGetSession,
        updateUser: mockUpdateUser,
      },
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows loader while verifying session', async () => {
    let resolveSession: (_value: any) => void = () => {}
    mockGetSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve
      })
    )

    render(<UpdatePasswordPage />)

    expect(screen.getByText('Verifying session...')).toBeInTheDocument()

    await act(async () => {
      resolveSession({ data: { session: null } })
    })
  })

  it('shows expired link UI if no session exists', async () => {
    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByText('Link Expired')).toBeInTheDocument()
      expect(screen.getByText('Request New Link')).toBeInTheDocument()
    })
  })

  it('renders form elements when a valid session is present', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { id: 'test-session' } },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument()
    })
  })

  it('shows error if passwords do not match', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { id: 'test-session' } },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password456' },
    })

    fireEvent.submit(screen.getByLabelText('New Password').closest('form')!)

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('shows error if password is less than 8 characters', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { id: 'test-session' } },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'pass' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'pass' },
    })

    fireEvent.submit(screen.getByLabelText('New Password').closest('form')!)

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('calls updateUser and handles weak password error from Supabase', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { id: 'test-session' } },
    })
    mockUpdateUser.mockResolvedValue({
      error: { message: 'weak password error from auth engine' },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    })

    fireEvent.submit(screen.getByLabelText('New Password').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Password is too weak/i)).toBeInTheDocument()
    })
  })

  it('calls updateUser and handles same password error from Supabase', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { id: 'test-session' } },
    })
    mockUpdateUser.mockResolvedValue({
      error: { message: 'cannot be the same password' },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    })

    fireEvent.submit(screen.getByLabelText('New Password').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/New password must be different/i)).toBeInTheDocument()
    })
  })

  it('submits successfully and redirects to login after timeout', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { id: 'test-session' } },
    })

    render(<UpdatePasswordPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'validpassword123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'validpassword123' },
    })

    fireEvent.submit(screen.getByLabelText('New Password').closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Password Updated')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()

    // Advance timers by 3 seconds (3000ms)
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
