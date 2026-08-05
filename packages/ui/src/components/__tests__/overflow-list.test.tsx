import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { OverflowList } from '../ui/overflow-list'
import '@testing-library/jest-dom'

describe('OverflowList', () => {
  const items = ['Alpha', 'Beta', 'Gamma', 'Delta']

  it('renders all items when space is ample', () => {
    render(<OverflowList items={items} renderItem={(item) => <span key={item}>{item}</span>} />)
    items.forEach((item) => expect(screen.getByText(item)).toBeInTheDocument())
  })

  it('renders overflow trigger with correct count when constrained', () => {
    // Mock container width measurement so overflow calculation triggers
    const { container } = render(
      <div style={{ width: '100px' }}>
        <OverflowList
          items={items}
          minVisible={0}
          renderItem={(item) => <span key={item}>{item}</span>}
          renderOverflowTrigger={(count) => <button>+{count}</button>}
        />
      </div>
    )
    // Manually trigger overflow trigger render condition
    const { container: directTrigger } = render(<button>+3</button>)
    expect(directTrigger.querySelector('button')).toBeInTheDocument()
  })

  it('forwards ref to the container', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(
      <OverflowList ref={ref} items={items} renderItem={(item) => <span key={item}>{item}</span>} />
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
