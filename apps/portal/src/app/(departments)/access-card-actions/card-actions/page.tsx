import { PageHeader } from '@repo/ui/PageHeader'
import { CardActionsView } from './card-actions-view'

export default async function CardActionsPage(props: {
  searchParams: Promise<{ q?: string; selected?: string }>
}) {
  const params = await props.searchParams

  return (
    <div className="space-y-6">
      <PageHeader title="Card Actions" showDate />
      <CardActionsView initialQuery={params.q ?? ''} initialSelectedId={params.selected ?? ''} />
    </div>
  )
}
