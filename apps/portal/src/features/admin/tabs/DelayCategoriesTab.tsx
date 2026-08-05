import { ReferenceDataTab } from '../components/ReferenceDataTab'

/**
 * DelayCategoriesTab — Admin-only management of the `delay_categories`
 * reference table. Consumed read-only by department delay-logging UIs.
 */
export function DelayCategoriesTab() {
  return (
    <ReferenceDataTab
      tableName="delay_categories"
      title="Delay Categories"
      description="Standardized delay categories used across department delay logs. Created and updated only from the Admin department."
      columns={[
        { key: 'name', label: 'Name', editable: true, placeholder: 'e.g. Equipment Breakdown' },
        { key: 'color', label: 'Color', editable: true, type: 'color' },
        { key: 'icon', label: 'Icon', editable: true, placeholder: 'e.g. Wrench' },
        { key: 'sort_order', label: 'Sort Order', editable: true, type: 'number' },
      ]}
      displayColumns={['name', 'color', 'icon', 'sort_order']}
    />
  )
}
