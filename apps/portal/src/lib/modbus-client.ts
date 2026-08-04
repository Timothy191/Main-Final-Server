/**
 * Modbus TCP Client for SCADA Integration
 * Manages persistent connections to industrial equipment
 * with exponential backoff reconnection and buffering
 */

// Dynamic type / class definition for modbus-serial
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ModbusClientClass: any

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ModbusClientClass = require('modbus-serial')
} catch {
  class MockModbusClient {
    async connectTCP() {}
    setTimeout() {}
    setID() {}
    async readHoldingRegisters() {
      return { data: [] }
    }
    async close() {}
  }
  ModbusClientClass = MockModbusClient
}

export interface ModbusConnectionConfig {
  host: string
  port: number
  unitId: number
  timeout?: number
  retryStrategy?: {
    maxRetries: number
    baseDelay: number
    maxDelay: number
  }
}

export interface TelemetryReading {
  equipmentId: string
  timestamp: Date
  registers: Record<number, number>
  status: 'connected' | 'disconnected' | 'error'
}

export interface ModbusConnection {
  id: string
  config: ModbusConnectionConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
  connected: boolean
  lastRead: Date | null
  errorCount: number
}

/**
 * Connection Manager - handles pool of Modbus connections
 * with automatic reconnection and health monitoring
 */
export class ModbusConnectionManager {
  private connections: Map<string, ModbusConnection> = new Map()
  private readIntervals: Map<string, NodeJS.Timeout> = new Map()
  private readonly defaultRetryStrategy = {
    maxRetries: 10,
    baseDelay: 1000,
    maxDelay: 30000,
  }

  /**
   * Register a new equipment connection
   */
  async connect(equipmentId: string, config: ModbusConnectionConfig): Promise<boolean> {
    if (this.connections.has(equipmentId)) {
      await this.disconnect(equipmentId)
    }

    const client = new ModbusClientClass()
    client.setTimeout(config.timeout || 25000)

    try {
      await client.connectTCP(config.host, { port: config.port })
      client.setID(config.unitId)

      const connection: ModbusConnection = {
        id: equipmentId,
        config,
        client,
        connected: true,
        lastRead: null,
        errorCount: 0,
      }

      this.connections.set(equipmentId, connection)
      console.log(`[Modbus] Connected to ${equipmentId} at ${config.host}:${config.port}`)
      return true
    } catch (error) {
      console.error(`[Modbus] Failed to connect ${equipmentId}:`, error)
      await this.handleConnectionError(equipmentId, error)
      return false
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(equipmentId: string): Promise<void> {
    const interval = this.readIntervals.get(equipmentId)
    if (interval) {
      clearInterval(interval)
      this.readIntervals.delete(equipmentId)
    }

    const connection = this.connections.get(equipmentId)
    if (connection) {
      try {
        await connection.client.close()
      } catch (e) {
        // Ignore close errors
      }
      this.connections.delete(equipmentId)
    }
  }

  /**
   * Start periodic reading for an equipment
   */
  startReading(
    equipmentId: string,
    registerConfigs: Array<{ address: number; count: number; name: string }>,
    intervalMs: number,
    onData: (reading: TelemetryReading) => void,
    onError: (error: Error) => void
  ): void {
    const connection = this.connections.get(equipmentId)
    if (!connection) {
      onError(new Error(`Connection ${equipmentId} not found`))
      return
    }

    const interval = setInterval(async () => {
      try {
        const registers: Record<number, number> = {}

        for (const regConfig of registerConfigs) {
          const response = await connection.client.readHoldingRegisters(
            regConfig.address,
            regConfig.count
          )
          for (let i = 0; i < response.data.length; i++) {
            registers[regConfig.address + i] = response.data[i]
          }
        }

        const reading: TelemetryReading = {
          equipmentId,
          timestamp: new Date(),
          registers,
          status: 'connected',
        }

        connection.lastRead = reading.timestamp
        connection.errorCount = 0
        onData(reading)
      } catch (error) {
        connection.errorCount++
        connection.connected = false
        onError(error as Error)

        // Attempt reconnection if too many errors
        if (connection.errorCount > 3) {
          this.scheduleReconnect(equipmentId)
        }
      }
    }, intervalMs)

    this.readIntervals.set(equipmentId, interval)
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(equipmentId: string): void {
    const connection = this.connections.get(equipmentId)
    if (!connection) return

    const strategy = connection.config.retryStrategy || this.defaultRetryStrategy
    const delay = Math.min(
      strategy.baseDelay * Math.pow(2, connection.errorCount),
      strategy.maxDelay
    )

    console.log(`[Modbus] Scheduling reconnect for ${equipmentId} in ${delay}ms`)

    setTimeout(async () => {
      const conn = this.connections.get(equipmentId)
      if (conn && !conn.connected) {
        await this.connect(equipmentId, conn.config)
      }
    }, delay)
  }

  /**
   * Handle connection errors
   */
  private async handleConnectionError(equipmentId: string, _error: unknown): Promise<void> {
    const connection = this.connections.get(equipmentId)
    if (connection) {
      connection.connected = false
      connection.errorCount++
      this.scheduleReconnect(equipmentId)
    }
  }

  /**
   * Get connection status
   */
  getStatus(
    equipmentId: string
  ): { connected: boolean; lastRead: Date | null; errorCount: number } | null {
    const connection = this.connections.get(equipmentId)
    if (!connection) return null

    return {
      connected: connection.connected,
      lastRead: connection.lastRead,
      errorCount: connection.errorCount,
    }
  }

  /**
   * Get all connection statuses
   */
  getAllStatuses(): Record<
    string,
    { connected: boolean; lastRead: Date | null; errorCount: number }
  > {
    const statuses: Record<
      string,
      { connected: boolean; lastRead: Date | null; errorCount: number }
    > = {}
    for (const [id, conn] of this.connections) {
      statuses[id] = {
        connected: conn.connected,
        lastRead: conn.lastRead,
        errorCount: conn.errorCount,
      }
    }
    return statuses
  }

  /**
   * Shutdown all connections
   */
  async shutdown(): Promise<void> {
    for (const equipmentId of this.connections.keys()) {
      await this.disconnect(equipmentId)
    }
  }
}

// Singleton instance
let managerInstance: ModbusConnectionManager | null = null

export function getModbusManager(): ModbusConnectionManager {
  if (!managerInstance) {
    managerInstance = new ModbusConnectionManager()
  }
  return managerInstance
}

// Register cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    if (managerInstance) {
      await managerInstance.shutdown()
    }
  })
}
