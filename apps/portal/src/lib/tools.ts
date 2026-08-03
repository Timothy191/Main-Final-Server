import { cacheLife, cacheTag } from 'next/cache'
import { createReadReplicaClient } from '@repo/supabase/read-replica'
import { serverLogger } from '@repo/logger'
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
 * Fetch productivity tools from database.
 * Falls back to PRODUCTIVITY_TOOLS constant if database query fails.
 */
export async function getTools(): Promise<Tool[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('tools')
  const db = await createReadReplicaClient()

  const { data, error } = await db
    .from('tools')
    .select('id, name, display_name, description, icon, color')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    serverLogger().warn('Failed to fetch tools from database, falling back to constant:', error)
    return PRODUCTIVITY_TOOLS.map((t, i) => ({
      id: String(i),
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      icon: t.icon,
      color: t.color,
    }))
  }

  if (!data || data.length === 0) {
    return PRODUCTIVITY_TOOLS.map((t, i) => ({
      id: String(i),
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      icon: t.icon,
      color: t.color,
    }))
  }

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    displayName: t.display_name,
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
