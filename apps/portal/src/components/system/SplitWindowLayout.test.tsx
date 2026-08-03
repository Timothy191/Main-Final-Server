import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { SplitWindowLayout } from './SplitWindowLayout'
import { useSplitWindow } from '@/hooks/useSplitWindow'

describe('SplitWindowLayout', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSplitWindow.setState({
      isOpen: false,
      tabs: [],
      activeTabId: null,
    })
  })

  it('renders children in main workspace', () => {
    render(
      <SplitWindowLayout>
        <div data-testid="main-content">Main Content</div>
      </SplitWindowLayout>
    )
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByText('Main Content')).toBeInTheDocument()
  })

  it('opens a tab when open-split-view event is dispatched', async () => {
    render(
      <SplitWindowLayout>
        <div>Main</div>
      </SplitWindowLayout>
    )

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('open-split-view', {
          detail: { service: 'whatsapp' },
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    })
  })

  it('opens multiple tabs for different services', async () => {
    render(
      <SplitWindowLayout>
        <div>Main</div>
      </SplitWindowLayout>
    )

    await act(async () => {
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'github' } }))
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'whatsapp' } }))
    })

    await waitFor(() => {
      expect(screen.getByText('GitHub')).toBeInTheDocument()
      expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    })
  })

  it('focuses existing tab instead of duplicating when same service is opened', async () => {
    render(
      <SplitWindowLayout>
        <div>Main</div>
      </SplitWindowLayout>
    )

    await act(async () => {
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'whatsapp' } }))
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'whatsapp' } }))
    })

    await waitFor(() => {
      const whatsAppTabs = screen.getAllByText('WhatsApp')
      expect(whatsAppTabs).toHaveLength(1)
    })
  })

  it('closes a tab when close button is clicked', async () => {
    render(
      <SplitWindowLayout>
        <div>Main</div>
      </SplitWindowLayout>
    )

    await act(async () => {
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'whatsapp' } }))
    })

    const closeButton = await waitFor(() => screen.getByTestId('close-tab-whatsapp'))

    await act(async () => {
      fireEvent.click(closeButton)
    })

    await waitFor(() => {
      expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    })
  })

  it('closes all tabs when global close button is clicked', async () => {
    render(
      <SplitWindowLayout>
        <div>Main</div>
      </SplitWindowLayout>
    )

    await act(async () => {
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'github' } }))
      window.dispatchEvent(new CustomEvent('open-split-view', { detail: { service: 'whatsapp' } }))
    })

    const closeAllButton = await waitFor(() => screen.getByLabelText('Close all tabs'))

    await act(async () => {
      fireEvent.click(closeAllButton)
    })

    await waitFor(() => {
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
      expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument()
    })
  })
})
