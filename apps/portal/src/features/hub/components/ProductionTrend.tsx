'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface TrendDataPoint {
  date: string
  Drilling: number
  Production: number
  Engineering: number
}

interface ProductionTrendProps {
  data: TrendDataPoint[]
}

const CATEGORIES = [
  { key: 'Drilling', color: 'var(--color-blue, #3b82f6)' },
  { key: 'Production', color: 'var(--color-emerald, #10b981)' },
  { key: 'Engineering', color: 'var(--color-violet, #8b5cf6)' },
] as const

export function ProductionTrend({ data }: ProductionTrendProps) {
  if (data.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-arch-text-primary">Site Production Trend</h3>
          <p className="text-xs text-arch-text-tertiary">
            Real-time output across core departments
          </p>
        </div>
        <div className="flex gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-xs text-arch-text-tertiary">{cat.key}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted, #9ca3af)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #9ca3af)" width={48} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid var(--border, #e5e7eb)',
              backgroundColor: 'var(--card, #fff)',
            }}
          />
          {CATEGORIES.map((cat) => (
            <Area
              key={cat.key}
              type="monotone"
              dataKey={cat.key}
              stroke={cat.color}
              fill={cat.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
