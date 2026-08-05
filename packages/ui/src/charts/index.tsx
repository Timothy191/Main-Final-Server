/**
 * @repo/ui/charts — Recharts wrappers styled for Arch System glass design.
 *
 * Uses the recharts dependency already declared in apps/portal. No new
 * charting libraries are introduced.
 *
 * AGENT-TRACE: reverse-engineered from recharts' declarative composition API
 * and centralized to enforce glass-styled tooltips/grids across dashboards.
 */

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
  Cell,
  Label,
  LabelList,
} from 'recharts'

import type { TooltipProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

export {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
  Cell,
  Label,
  LabelList,
}

export type { TooltipProps }
export type { NameType, ValueType }

/**
 * Glass-styled tooltip content for Recharts.
 * Use as the `content` prop on `<Tooltip />`:
 *
 * ```tsx
 * <Tooltip content={GlassTooltip} />
 * ```
 */
export function GlassTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass-surface min-w-[8rem] rounded-card border border-[var(--arch-glass-border)] p-2 shadow-window">
      {label != null && (
        <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-[var(--text-body)]">
            {entry.color && (
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            )}
            <span className="flex-1 truncate">
              {entry.name}: <strong>{entry.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Glass-styled cartesian grid for Recharts.
 * Use in place of `<CartesianGrid />`.
 */
export function GlassCartesianGrid({
  stroke = 'var(--border-subtle)',
  strokeDasharray = '3 3',
  ...props
}: React.ComponentProps<typeof CartesianGrid>) {
  return <CartesianGrid stroke={stroke} strokeDasharray={strokeDasharray} {...props} />
}
