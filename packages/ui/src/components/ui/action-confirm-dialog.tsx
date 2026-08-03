interface ActionConfirmDialogProps {
  children?: React.ReactNode
  open?: boolean
  onClose?: () => void
  onConfirm?: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  variant?: string
}

export function ActionConfirmDialog({ children }: ActionConfirmDialogProps) {
  return <div>{children}</div>
}
