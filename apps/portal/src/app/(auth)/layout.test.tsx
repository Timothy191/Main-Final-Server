import { render } from '@testing-library/react'
import AuthLayout from './layout'

describe('AuthLayout', () => {
  let originalConsoleError: typeof console.error

  beforeAll(() => {
    originalConsoleError = console.error
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  it('renders children correctly', () => {
    const { getByText } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    )
    expect(getByText('Test Child')).toBeInTheDocument()
  })

  it('applies container layout classes', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    )

    const outerContainer = container.firstChild
    expect(outerContainer).toHaveClass('relative')
    expect(outerContainer).toHaveClass('min-h-[calc(100vh-28px)]')
    expect(outerContainer).toHaveClass('w-full')
    expect(outerContainer).toHaveClass('h-full')
    expect(outerContainer).toHaveClass('flex')
    expect(outerContainer).toHaveClass('overflow-hidden')
  })

  it('unmounts cleanly without side effects', () => {
    const { unmount } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    )
    expect(() => unmount()).not.toThrow()
  })
})
