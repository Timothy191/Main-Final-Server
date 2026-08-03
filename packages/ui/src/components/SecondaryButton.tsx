import * as React from 'react'
import { clsx } from 'clsx'

export interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  /** Accepted for call-site compatibility; not applied to the DOM. */
  variant?: string
  /** Accepted for call-site compatibility; not applied to the DOM. */
  size?: string
}

export function SecondaryButton({
  children,
  asChild = false,
  variant: _variant,
  size: _size,
  className,
  ...props
}: SecondaryButtonProps): React.ReactElement {
  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      ...props,
      className: clsx(children.props.className, className),
    } as never)
  }

  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  )
}
