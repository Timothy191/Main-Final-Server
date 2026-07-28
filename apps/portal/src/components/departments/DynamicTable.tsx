import { createServerSupabaseClient } from '@repo/supabase/server'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import { redirect } from 'next/navigation'

export async function DynamicTable({
  title,
  description,
  tableName,
  filterColumn,
  filterValue,
}: {
  title: string
  description: string
  tableName: string
  filterColumn?: string
  filterValue?: string
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  let query = supabase.from(tableName).select('*').limit(30)

  if (filterColumn && filterValue) {
    query = query.eq(filterColumn, filterValue)
  }

  const { data: rows, error } = await query

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6">
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">{title}</h2>
          <p className="text-arch-text-muted text-sm">{description}</p>
        </div>
        <GlassCard className="p-6 text-red-500">
          Error loading data from {tableName}: {error.message}
        </GlassCard>
      </div>
    )
  }

  const columns =
    rows && rows.length > 0
      ? Object.keys(rows[0]).filter((k) => k !== 'id' && !k.endsWith('_id') && !k.endsWith('_at'))
      : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">{title}</h2>
        <p className="text-arch-text-muted text-sm">{description}</p>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="px-4 py-3 font-semibold capitalize">
                    {col.replace(/_/g, ' ')}
                  </TableHead>
                ))}
                {columns.length === 0 && (
                  <TableHead className="px-4 py-3 font-semibold">Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {rows && rows.length > 0 ? (
                rows.map((row: Record<string, unknown>, i: number) => (
                  <TableRow
                    key={String(row.id ?? i)}
                    className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                  >
                    {columns.map((col) => (
                      <TableCell key={col} className="px-4 py-3 text-arch-text-secondary">
                        {String(row[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(columns.length, 1)}
                    className="px-4 py-8 text-center text-arch-text-muted"
                  >
                    No data available in {tableName}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  )
}
