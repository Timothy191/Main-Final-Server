import { ReferenceDataTab } from '../components/ReferenceDataTab'

/**
 * OperatorsTab — Admin-only management of the `operators` reference table.
 * Operators are consumed read-only by department UIs (e.g. Control Room shift
 * sheet operator dropdown). Created/updated here.
 */
export function OperatorsTab() {
  return (
    <ReferenceDataTab
      tableName="operators"
      title="Operators"
      description="Field operators available for assignment to machine shifts and excavator activity. Created and updated only from the Admin department."
      columns={[
        { key: 'full_name', label: 'Full Name', editable: true, placeholder: 'e.g. John Doe' },
        {
          key: 'employee_code',
          label: 'Employee Code',
          editable: true,
          placeholder: 'e.g. OP-001',
        },
        {
          key: 'role',
          label: 'Role',
          editable: true,
          type: 'select',
          options: [
            { value: 'operator', label: 'Operator' },
            { value: 'supervisor', label: 'Supervisor' },
            { value: 'relief', label: 'Relief' },
          ],
        },
      ]}
      displayColumns={['full_name', 'employee_code', 'role']}
    />
  )
}
