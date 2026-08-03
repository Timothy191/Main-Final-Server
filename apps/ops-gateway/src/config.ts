export const config = {
  // NestJS Ops API connection
  opsApiUrl: process.env.OPS_API_URL ?? 'http://host.docker.internal:3001/api/ops',
  opsSecret: process.env.OPS_SECRET ?? '',

  // Redis connection (shared with NestJS backend)
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  // MCP server
  mcpPort: parseInt(process.env.MCP_PORT ?? '3100', 10),
  mcpHost: process.env.MCP_HOST ?? '0.0.0.0',

  // Polling intervals (ms)
  healthPollIntervalMs: parseInt(process.env.HEALTH_POLL_INTERVAL_MS ?? '15000', 10),
  metricsPollIntervalMs: parseInt(process.env.METRICS_POLL_INTERVAL_MS ?? '30000', 10),

  // Redis stream to subscribe to
  triggerStreamKey: process.env.TRIGGER_STREAM_KEY ?? 'ai:triggers:stream',
  triggerConsumerGroup: process.env.TRIGGER_CONSUMER_GROUP ?? 'ops-gateway',
  triggerConsumerName: process.env.TRIGGER_CONSUMER_NAME ?? 'gateway-1',

  // Incident detection
  incidentThreshold5xx: parseInt(process.env.INCIDENT_THRESHOLD_5XX ?? '5', 10),
  incidentWindowMs: parseInt(process.env.INCIDENT_WINDOW_MS ?? '60000', 10),

  // Agent dispatcher configuration
  enableAgentDispatch: process.env.ENABLE_AGENT_DISPATCH !== 'false',
  projectRoot: process.env.PROJECT_ROOT ?? process.cwd(),
  agentDispatchers: {
    opencode: {
      enabled: (process.env.OPENCODE_ENABLED ?? 'true') === 'true',
      autoApprove: (process.env.OPENCODE_AUTO_APPROVE ?? 'false') === 'true',
      timeoutMs: parseInt(process.env.OPENCODE_TIMEOUT_MS ?? '120000', 10),
    },
  },
} as const
