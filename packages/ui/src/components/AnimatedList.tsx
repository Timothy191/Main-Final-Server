interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return <div className={className}>{children}</div>
}

/** Alias used by hub / access-control activity feeds. */
export function AutoAnimateList({ children, className }: AnimatedListProps) {
  return <AnimatedList className={className}>{children}</AnimatedList>
}
