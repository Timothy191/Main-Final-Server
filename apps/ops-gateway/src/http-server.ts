import http from 'node:http'
import { config } from './config.js'
import { Logger } from './logger.js'

const logger = new Logger('http-server')

export function startHttpServer(): void {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`)

    // Set headers
    res.setHeader('Content-Type', 'application/json')

    if (url.pathname === '/health') {
      res.writeHead(200)
      res.end(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            'ops-gateway': 'healthy',
          },
        })
      )
      return
    }

    res.writeHead(200)
    res.end(
      JSON.stringify({
        name: 'arch-ops-gateway',
        status: 'online',
        timestamp: new Date().toISOString(),
      })
    )
  })

  const port = config.mcpPort
  server.listen(port, '0.0.0.0', () => {
    logger.info(`HTTP server listening on http://0.0.0.0:${port}`)
  })
}
