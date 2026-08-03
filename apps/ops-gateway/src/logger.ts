export class Logger {
  constructor(private readonly name: string) {}

  private fmt(level: string, message: string): string {
    return `[${new Date().toISOString()}] [${level}] [${this.name}] ${message}`
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.error(this.fmt('DEBUG', message))
    }
  }

  info(message: string): void {
    console.error(this.fmt('INFO', message))
  }

  warn(message: string): void {
    console.error(this.fmt('WARN', message))
  }

  error(message: string): void {
    console.error(this.fmt('ERROR', message))
  }
}
