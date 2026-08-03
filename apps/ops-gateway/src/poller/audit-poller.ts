import { opsClient } from '../ops-client.js'
import { Logger } from '../logger.js'

const logger = new Logger('audit-poller')

export interface PolledAudit {
  id: string
  totalIssues: number
  errorCount: number
  warningCount: number
  infoCount: number
  issuesByCategory: Record<string, number>
  summary: string
  timestamp: string
  tablesScanned: number
  totalTables: number
  /** Per-table issues, keyed by issue category with list of table names */
  tablesByIssue: Record<string, string[]>
}

let latestAudit: PolledAudit | null = null

export function getLatestAudit(): PolledAudit | null {
  return latestAudit
}

export async function runAuditCheck(): Promise<PolledAudit | null> {
  try {
    const report = await opsClient.runAudit()

    // Build per-category table index for targeted repair
    const tablesByIssue: Record<string, string[]> = {}
    for (const table of report.tables) {
      for (const issue of table.issues) {
        if (!tablesByIssue[issue.category]) {
          tablesByIssue[issue.category] = []
        }
        if (!tablesByIssue[issue.category]!.includes(table.tableName)) {
          tablesByIssue[issue.category]!.push(table.tableName)
        }
      }
    }

    const polled: PolledAudit = {
      id: report.id,
      totalIssues: report.totalIssues,
      errorCount: report.errorCount,
      warningCount: report.warningCount,
      infoCount: report.infoCount,
      issuesByCategory: report.issuesByCategory,
      summary: report.summary,
      timestamp: report.completedAt,
      tablesScanned: report.tablesScanned,
      totalTables: report.totalTables,
      tablesByIssue,
    }
    latestAudit = polled

    if (report.errorCount > 0) {
      logger.warn(`Audit found ${report.errorCount} error(s): ${report.summary}`)
    } else if (report.warningCount > 0) {
      logger.info(`Audit found ${report.warningCount} warning(s): ${report.summary}`)
    } else {
      logger.info(`Audit clean: ${report.summary}`)
    }

    return polled
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Audit poll failed: ${message}`)
    return null
  }
}
