import { cacheLife, cacheTag } from 'next/cache'
import { PRODUCTIVITY_TOOLS } from '@/lib/departments'

interface Tool {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  color: string
}

interface ExternalTool {
  name: string
  displayName: string
  url: string
  description: string
  icon: string
  color: string
}

/**
 * Productivity tools — served from the static constant.
 * The `tools` database table does not exist; the constant is the source of truth.
 */
export async function getTools(): Promise<Tool[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('tools')

  return PRODUCTIVITY_TOOLS.map((t, i) => ({
    id: String(i),
    name: t.name,
    displayName: t.displayName,
    description: t.description,
    icon: t.icon,
    color: t.color,
  }))
}

/**
 * External tool configurations.
 * Override URLs via environment variables:
 *   N8N_URL=http://localhost:5678
 *   FLOWISE_URL=http://localhost:3001
 *
 * (Flowise runs on port 3001 in docker-compose.tools.yml;
 *  port 3000 is reserved for the Next.js dev server.)
 */
export const EXTERNAL_TOOLS: ExternalTool[] = [
  {
    name: 'n8n',
    displayName: 'n8n',
    url: process.env.N8N_URL ?? 'http://localhost:5678',
    description:
      'Workflow automation and integration platform — build no-code automations with 400+ integrations',
    icon: 'Workflow',
    color: '#ff6d5a',
  },
  {
    name: 'flowise',
    displayName: 'Flowise',
    url: process.env.FLOWISE_URL ?? 'http://localhost:3001',
    description: 'Visual AI workflow builder — drag-and-drop LangChain agents and LLM pipelines',
    icon: 'Bot',
    color: '#3ecf8e',
  },
]
