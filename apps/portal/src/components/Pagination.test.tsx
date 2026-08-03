import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CursorPagination } from '@repo/ui/components/ui/pagination'
import '@testing-library/jest-dom'

describe('CursorPagination Component', () => {
  const defaultProps = {
    nextCursor: 'eyJzIjoiMjAyNC0wMS0wMSIsImliOiJhYmMifQ==',
    previousCursors: [],
    hasNextPage: true,
    pageSize: 50,
    loadedCount: 50,
    totalCount: 200,
    onNext: jest.fn(),
    onPrevious: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with total count on first page', () => {
    render(<CursorPagination {...defaultProps} />)

    expect(screen.getByText('50 of 200 entries')).toBeInTheDocument()
    expect(screen.getByText(/Page 1/)).toBeInTheDocument()
    expect(screen.getByText(/of ~4/)).toBeInTheDocument()
  })

  it('disables Previous button on first page', () => {
    render(<CursorPagination {...defaultProps} previousCursors={[]} />)

    const prevBtn = screen.getByRole('button', { name: /Previous/i })
    expect(prevBtn).toBeDisabled()
  })

  it('enables Previous button when there are previous cursors', () => {
    render(
      <CursorPagination
        {...defaultProps}
        previousCursors={['eyJzIjoiMjAyMy0xMi0zMSIsImliOiJ4eXoifQ==']}
      />
    )

    const prevBtn = screen.getByRole('button', { name: /Previous/i })
    expect(prevBtn).not.toBeDisabled()
  })

  it('disables Next button when no next page', () => {
    render(<CursorPagination {...defaultProps} nextCursor={null} hasNextPage={false} />)

    const nextBtn = screen.getByRole('button', { name: /Next/i })
    expect(nextBtn).toBeDisabled()
  })

  it('enables Next button when next page exists', () => {
    render(<CursorPagination {...defaultProps} />)

    const nextBtn = screen.getByRole('button', { name: /Next/i })
    expect(nextBtn).not.toBeDisabled()
  })

  it('calls onNext with cursor when Next is clicked', () => {
    const onNext = jest.fn()
    render(<CursorPagination {...defaultProps} onNext={onNext} />)

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    expect(onNext).toHaveBeenCalledWith(defaultProps.nextCursor)
  })

  it('calls onPrevious with last cursor when Previous is clicked', () => {
    const onPrevious = jest.fn()
    const cursors = ['abc', 'def']
    render(<CursorPagination {...defaultProps} previousCursors={cursors} onPrevious={onPrevious} />)

    fireEvent.click(screen.getByRole('button', { name: /Previous/i }))
    expect(onPrevious).toHaveBeenCalledWith('def')
  })

  it("calls onPrevious with 'start' when clicking Previous on page 2", () => {
    const onPrevious = jest.fn()
    render(
      <CursorPagination
        {...defaultProps}
        previousCursors={['first-cursor']}
        onPrevious={onPrevious}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Previous/i }))
    expect(onPrevious).toHaveBeenCalledWith('first-cursor')
  })

  it('calls onPageSizeChange when size selector changes', () => {
    const onPageSizeChange = jest.fn()
    render(<CursorPagination {...defaultProps} onPageSizeChange={onPageSizeChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '25' } })
    expect(onPageSizeChange).toHaveBeenCalledWith(25)
  })

  it('shows loaded count without total when totalCount is undefined', () => {
    render(<CursorPagination {...defaultProps} totalCount={undefined} loadedCount={30} />)

    expect(screen.getByText('30 entries loaded')).toBeInTheDocument()
  })

  it('shows page number based on cursor stack depth', () => {
    render(<CursorPagination {...defaultProps} previousCursors={['c1', 'c2', 'c3']} />)

    // Page = previousCursors.length + 1 = 4
    expect(screen.getByText(/Page 4/)).toBeInTheDocument()
  })
})
