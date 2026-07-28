const fs = require('fs')
const path = require('path')

const mappings = [
  { file: 'apps/portal/src/app/(departments)/engineering/machines/page.tsx', table: 'machines', title: 'Machines', desc: 'All machines under engineering.' },
  { file: 'apps/portal/src/app/(departments)/engineering/tools/page.tsx', table: 'equipment', title: 'Tools', desc: 'Engineering tools and equipment.' },
  { file: 'apps/portal/src/app/(departments)/engineering/daily-log/page.tsx', table: 'daily_logs', title: 'Daily Log', desc: 'Engineering daily logs.' },
  { file: 'apps/portal/src/app/(departments)/engineering/history/page.tsx', table: 'engineering_notes', title: 'History', desc: 'Historical engineering notes.' },
  { file: 'apps/portal/src/app/(departments)/engineering/reports/page.tsx', table: 'generated_reports', title: 'Reports', desc: 'Engineering reports.' },
  { file: 'apps/portal/src/app/(departments)/engineering/breakdowns/page.tsx', table: 'breakdowns', title: 'Breakdowns', desc: 'Machine breakdowns.' },
  { file: 'apps/portal/src/app/(departments)/satellite-monitoring/hyperspectral/page.tsx', table: 'machines', title: 'Hyperspectral', desc: 'Hyperspectral satellite data.' },
  { file: 'apps/portal/src/app/(departments)/satellite-monitoring/highres/page.tsx', table: 'machines', title: 'High-Res', desc: 'High-resolution satellite imagery.' },
  { file: 'apps/portal/src/app/(departments)/satellite-monitoring/sar/page.tsx', table: 'machines', title: 'SAR', desc: 'Synthetic Aperture Radar data.' },
  { file: 'apps/portal/src/app/(departments)/production/machines/page.tsx', table: 'machines', title: 'Machines', desc: 'Production machines.' },
  { file: 'apps/portal/src/app/(departments)/production/tools/page.tsx', table: 'equipment', title: 'Tools', desc: 'Production tools.' },
  { file: 'apps/portal/src/app/(departments)/production/daily-log/page.tsx', table: 'production_logs', title: 'Daily Log', desc: 'Production daily logs.' },
  { file: 'apps/portal/src/app/(departments)/production/history/page.tsx', table: 'daily_logs', title: 'History', desc: 'Historical production logs.' },
  { file: 'apps/portal/src/app/(departments)/production/reports/page.tsx', table: 'generated_reports', title: 'Reports', desc: 'Production reports.' },
  { file: 'apps/portal/src/app/(departments)/control-room/excavator-activity/page.tsx', table: 'excavator_activity', title: 'Excavator Activity', desc: 'Live excavator tracking.' },
  { file: 'apps/portal/src/app/(departments)/control-room/reports/page.tsx', table: 'generated_reports', title: 'Reports', desc: 'Control room reports.' },
  { file: 'apps/portal/src/app/(departments)/control-room/machine-operations/page.tsx', table: 'machine_operations', title: 'Machine Operations', desc: 'Live machine operations.' },
  { file: 'apps/portal/src/app/(departments)/control-room/engineering-notes/page.tsx', table: 'engineering_notes', title: 'Engineering Notes', desc: 'Engineering notes.' },
  { file: 'apps/portal/src/app/(departments)/safety/machines/page.tsx', table: 'machines', title: 'Machines', desc: 'Safety machines.' },
  { file: 'apps/portal/src/app/(departments)/safety/tools/page.tsx', table: 'equipment', title: 'Tools', desc: 'Safety tools.' },
  { file: 'apps/portal/src/app/(departments)/safety/daily-log/page.tsx', table: 'safety_incidents', title: 'Daily Log', desc: 'Safety daily logs and incidents.' },
  { file: 'apps/portal/src/app/(departments)/safety/history/page.tsx', table: 'safety_incidents', title: 'History', desc: 'Historical safety incidents.' },
  { file: 'apps/portal/src/app/(departments)/safety/reports/page.tsx', table: 'generated_reports', title: 'Reports', desc: 'Safety reports.' },
  { file: 'apps/portal/src/app/(departments)/access-control/reports/page.tsx', table: 'generated_reports', title: 'Reports', desc: 'Access control reports.' }
]

for (const m of mappings) {
  const content = `import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${m.title} | Arch OS',
  description: '${m.desc}',
}

export default function Page() {
  return (
    <DynamicTable
      title="${m.title}"
      description="${m.desc}"
      tableName="${m.table}"
    />
  )
}
`
  fs.writeFileSync(path.join(__dirname, m.file), content)
}
console.log('Rewrote ' + mappings.length + ' files.')
