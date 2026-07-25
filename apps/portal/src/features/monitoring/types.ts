/**
 * @module features/monitoring/types
 * Type definitions for the monitoring feature
 */

// ============================================================================
// KPI Metrics Types
// ============================================================================

export interface SystemStatus {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'offline' | 'maintenance'
  lastCheck: string
  responseTime: number | null
  uptime: number // percentage
}

export interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  source: string
}

export interface ResourceUtilization {
  cpu: number // percentage
  memory: number // percentage
  disk: number // percentage
  network: number // percentage
  timestamp: string
}

export interface MonitoringDashboardMetrics {
  totalSystems: number
  operationalSystems: number
  activeAlerts: number
  criticalAlerts: number
  averageResponseTime: number
  uptimePercentage: number
  resourceUtilization: ResourceUtilization
  recentAlerts: Alert[]
  systemStatuses: SystemStatus[]
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'stable' | 'alert'
  trendValue?: string
  color?: 'charcoal' | 'green' | 'red' | 'yellow' | 'blue'
  className?: string
  role?: string
}

export interface StatusIndicatorProps {
  status: 'operational' | 'degraded' | 'offline' | 'maintenance'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export interface AlertCardProps {
  alert: Alert
  onAcknowledge?: (alertId: string) => void
  className?: string
  role?: string
}

export interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  bgColor?: string
  className?: string
}

export interface MonitoringTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render?: (item: T) => React.ReactNode
    className?: string
  }[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface TimeSeriesData {
  timestamp: string
  value: number
  label?: string
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie'
  data: TimeSeriesData[] | Record<string, TimeSeriesData[]>
  options?: Record<string, unknown>
}

// ============================================================================
// API Response Types
// ============================================================================

export interface MonitoringApiResponse<T> {
  data: T
  cached: boolean
  timestamp: string
  cacheAge?: number
}

export interface MonitoringError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

// ============================================================================
// Filter and Sort Types
// ============================================================================

export type AlertSeverity = 'all' | 'critical' | 'warning' | 'info'
export type SystemStatusFilter = 'all' | 'operational' | 'degraded' | 'offline' | 'maintenance'
export type TimeRange = '1h' | '6h' | '12h' | '24h' | '7d' | '30d'

export interface MonitoringFilters {
  severity?: AlertSeverity
  status?: SystemStatusFilter
  timeRange?: TimeRange
  searchQuery?: string
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// Animation and Transition Types
// ============================================================================

export interface AnimationConfig {
  initial?: { opacity: number; y?: number; scale?: number }
  animate: { opacity: number; y?: number; scale?: number }
  exit?: { opacity: number; y?: number; scale?: number }
  transition?: { duration: number; ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' }
}

// ============================================================================
// Accessibility Types
// ============================================================================

export interface AriaLiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
  className?: string
}

// Export all types for external use
export type {
  SystemStatus as MonitoringSystemStatus,
  Alert as MonitoringAlert,
  ResourceUtilization as MonitoringResourceUtilization,
  MonitoringDashboardMetrics as DashboardMetrics,
}
