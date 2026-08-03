import type { ReactNode } from 'react'

export function KPI({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

interface KPICardProps {
  children?: ReactNode
  label?: string
  value?: string | number
  color?: string
  sub?: string
  icon?: ReactNode
}

export function KPICard({ children, label, value, color, sub, icon }: KPICardProps) {
  return <div>{children ?? label ?? value ?? color ?? sub ?? icon}</div>
}

interface KPIGridProps {
  children: ReactNode
  cols?: number
}

export function KPIGrid({ children, cols: _cols }: KPIGridProps) {
  return <div>{children}</div>
}
