/**
 * Logging utilities for typegen pipeline
 * 
 * Provides structured logging with different levels and formatting.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class Logger {
  private entries: LogEntry[] = []
  private minLevel: LogLevel = 'info'

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    }

    this.entries.push(entry)

    // Console output with colors
    const colorMap = {
      debug: '\x1b[90m',    // Gray
      info: '\x1b[36m',     // Cyan
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      success: '\x1b[32m',  // Green
    }

    const reset = '\x1b[0m'
    const color = colorMap[level]
    const prefix = `[${level.toUpperCase()}]`
    
    console.log(`${color}${prefix}${reset} ${message}`)
    
    if (data) {
      console.log(`${color}  ${JSON.stringify(data, null, 2)}${reset}`)
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: any): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: any): void {
    this.log('error', message, data)
  }

  success(message: string, data?: any): void {
    this.log('success', message, data)
  }

  section(title: string): void {
    console.log('\n' + '='.repeat(50))
    console.log(` ${title}`)
    console.log('='.repeat(50))
  }

  stats(label: string, value: string | number): void {
    console.log(`ℹ️  ${label}: ${value}`)
  }

  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  clear(): void {
    this.entries = []
  }
}

export const logger = new Logger()
