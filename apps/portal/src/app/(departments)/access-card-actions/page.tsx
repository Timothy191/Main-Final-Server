import { PageHeader } from '@repo/ui/PageHeader'
import { GlassCard } from '@repo/ui/GlassCard'
import { KPICard, KPIGrid } from '@repo/ui/KPI'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/ui/tabs'
import { CardActionsTab } from './components/CardActionsTab'
import { Printer, Layers, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import type { IssuedCardsRow } from '@repo/supabase'
import { getDashboardMetrics, getExpiringCards } from './actions'

interface ExpiringCard extends IssuedCardsRow {
  personnel: { first_name: string; surname: string } | null
}

function daysRemaining(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function getExpiryStatus(days: number): { label: string; pillClass: string } {
  if (days < 0)
    return {
      label: 'Expired',
      pillClass: 'bg-red-50/70 border-red-200/50 text-red-700',
    }
  if (days <= 2)
    return {
      label: 'Critical',
      pillClass: 'bg-red-50/70 border-red-200/50 text-red-700',
    }
  if (days <= 5)
    return {
      label: 'Warning',
      pillClass: 'bg-amber-50/70 border-amber-200/50 text-amber-700',
    }
  return {
    label: `${days} days`,
    pillClass: 'bg-accent-green/10 border-accent-green/20 text-accent-green',
  }
}

export default async function AccessCardActionsDashboardPage() {
  const [metrics, expiring] = await Promise.all([
    getDashboardMetrics().catch(() => ({
      onlinePrinters: 0,
      totalPrinters: 0,
      cardsPrintedToday: 0,
      pendingJobs: 0,
      expiringCards: 0,
    })),
    getExpiringCards().catch(() => ({ cards: [] })),
  ])

  const cards = expiring.cards.map((card: ExpiringCard) => {
    const person = card.personnel
    const name = person ? `${person.first_name} ${person.surname}` : 'Unknown'
    const days = daysRemaining(card.expires_at ?? '')
    const status = getExpiryStatus(days)
    return {
      id: card.id,
      ...card,
      entityName: name,
      daysRemaining: days,
      expiryStatus: status,
    } as ExpiringCard & {
      entityName: string
      daysRemaining: number
      expiryStatus: ReturnType<typeof getExpiryStatus>
    }
  })

  const onlinePrintersPct =
    metrics.totalPrinters > 0
      ? Math.round((metrics.onlinePrinters / metrics.totalPrinters) * 100)
      : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Access Card Actions Dashboard" showDate />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="actions">Card Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-0">
          <KPIGrid cols={4}>
            <KPICard
              label="Printers Online"
              value={`${metrics.onlinePrinters} / ${metrics.totalPrinters}`}
              color={onlinePrintersPct >= 50 ? 'green' : onlinePrintersPct > 0 ? 'default' : 'red'}
              sub={
                metrics.totalPrinters > 0
                  ? `${onlinePrintersPct}% online`
                  : 'No printers registered'
              }
              icon={<Printer className="w-8 h-8" />}
            />
            <KPICard
              label="Cards Printed Today"
              value={metrics.cardsPrintedToday}
              color="default"
              icon={<Layers className="w-8 h-8" />}
            />
            <KPICard
              label="Pending Jobs"
              value={metrics.pendingJobs}
              color={metrics.pendingJobs > 0 ? 'blue' : 'default'}
              sub={metrics.pendingJobs > 0 ? 'Awaiting processing' : 'All clear'}
              icon={<Clock className="w-8 h-8" />}
            />
            <KPICard
              label="Expiring Cards (7 days)"
              value={metrics.expiringCards}
              color={metrics.expiringCards > 0 ? 'red' : 'default'}
              sub={metrics.expiringCards > 0 ? 'Action required' : 'No cards expiring'}
              icon={<AlertTriangle className="w-8 h-8" />}
            />
          </KPIGrid>

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex items-center justify-between">
              <h3 className="font-medium text-arch-text-primary flex items-center">
                <Clock className="w-4 h-4 mr-2 text-arch-text-muted" />
                Expiring Cards
              </h3>
              <span className="text-xs text-arch-text-muted">
                {cards.length} card{cards.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-arch-border-default hover:bg-transparent">
                  <TableHead className="text-arch-text-muted">Personnel</TableHead>
                  <TableHead className="text-arch-text-muted">Expiry Date</TableHead>
                  <TableHead className="text-arch-text-muted">Days Remaining</TableHead>
                  <TableHead className="text-right text-arch-text-muted">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-arch-text-muted">
                      No expiring cards found.
                    </TableCell>
                  </TableRow>
                )}
                {cards.map((card) => (
                  <TableRow
                    key={card.id}
                    className="border-b border-arch-border-default/50 hover:bg-arch-surface-tertiary transition-colors"
                  >
                    <TableCell className="text-arch-text-primary">{card.entityName}</TableCell>
                    <TableCell className="text-arch-text-secondary">
                      {card.expires_at
                        ? new Date(card.expires_at).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-arch-text-secondary">
                      {card.daysRemaining < 0 ? 'Overdue' : `${card.daysRemaining}d`}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
                          card.expiryStatus.pillClass
                        )}
                      >
                        {card.daysRemaining < 0 ? (
                          <WifiOff className="w-3 h-3" />
                        ) : (
                          <Wifi className="w-3 h-3" />
                        )}
                        {card.expiryStatus.label}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </TabsContent>
        <TabsContent value="actions" className="space-y-6 mt-0">
          <CardActionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
