interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  className?: string
}

export function Tabs({ children, className }: TabsProps) {
  return <div className={className}>{children}</div>
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function TabsTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>
}

export function TabsContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
  value?: string
}) {
  return <div className={className}>{children}</div>
}
