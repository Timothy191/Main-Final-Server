import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { Logger } from '../logger.js'
import { defineTools, type ToolHandler } from './tools.js'

const logger = new Logger('mcp-server')

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    {
      name: 'arch-ops-gateway',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  const tools = defineTools()

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug(`Listing ${tools.length} tools`)
    return {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name
    const args = request.params.arguments ?? {}

    logger.info(`Tool call: ${toolName}`)

    const tool = tools.find((t) => t.name === toolName)
    if (!tool) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Unknown tool: ${toolName}`,
          },
        ],
        isError: true,
      }
    }

    try {
      const handler: ToolHandler = tool.handler
      const result = await handler(args)
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`Tool ${toolName} failed: ${message}`)
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
  logger.info('MCP server ready (stdio)')
}
