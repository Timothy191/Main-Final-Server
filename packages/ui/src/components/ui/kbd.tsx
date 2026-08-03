import * as React from 'react'
import { cn } from '../../lib/utils'

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 shadow-[0_1px_1px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}
