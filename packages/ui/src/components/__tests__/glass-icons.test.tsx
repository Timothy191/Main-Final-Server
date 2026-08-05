import React from 'react'
import { render, screen } from '@testing-library/react'
import { GlassIcons } from '../ui/glass-icons'
import '@testing-library/jest-dom'

describe('GlassIcons', () => {
  const items = [
    { icon: <svg data-testid="icon-1" />, label: 'Home', color: 'blue' as const },
    { icon: <svg data-testid="icon-2" />, label: 'Settings', color: 'green' as const },
  ]

  it('renders all item labels', () => {
    render(<GlassIcons items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders icons with aria-hidden', () => {
    const { container } = render(<GlassIcons items={items} />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('calls onClick when an item is clicked', () => {
    const handleClick = jest.fn()
    const clickableItems = [
      { icon: <svg data-testid="icon-1" />, label: 'Home', onClick: handleClick },
    ]
    render(<GlassIcons items={clickableItems} />)
    screen.getByRole('button', { name: 'Home' }).click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
