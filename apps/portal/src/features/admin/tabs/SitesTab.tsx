import { ReferenceDataTab } from '../components/ReferenceDataTab'

/**
 * SitesTab — Admin-only management of the `sites` reference table.
 * Sites are consumed read-only by department UIs (e.g. Control Room shift
 * sheet site dropdown). Created and updated here.
 */
export function SitesTab() {
  return (
    <ReferenceDataTab
      tableName="sites"
      title="Sites"
      description="Mine sites / locations available for assignment. Created and updated only from the Admin department."
      columns={[
        { key: 'name', label: 'Name', editable: true, placeholder: 'e.g. Pit Alpha' },
        { key: 'site_code', label: 'Site Code', editable: true, placeholder: 'e.g. PIT-ALPHA' },
      ]}
      displayColumns={['name', 'site_code']}
    />
  )
}
