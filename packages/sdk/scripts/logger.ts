/**
 * Enhanced Logger for Generators
 * 
 * Provides colored, structured logging with levels
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const

export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

const LOG_ICONS = {
  debug: '🔍',
  info: 'ℹ️ ',
  success: '✅',
  warn: '⚠️ ',
  error: '❌',
} as const

const LOG_COLORS = {
  debug: COLORS.dim,
  info: COLORS.cyan,
  success: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
} as const

/**
 * Enhanced logger with colored output
 */
export const logger = {
  /**
   * Debug message (dimmed)
   */
  debug: (msg: string, ...args: unknown[]) => {
    console.log(`${LOG_COLORS.debug}${LOG_ICONS.debug} ${msg}${COLORS.reset}`, ...args)
  },
  
  /**
   * Info message (cyan)
   */
  info: (msg: string, ...args: unknown[]) => {
    console.log(`${LOG_COLORS.info}${LOG_ICONS.info} ${msg}${COLORS.reset}`, ...args)
  },
  
  /**
   * Success message (green)
   */
  success: (msg: string, ...args: unknown[]) => {
    console.log(`${LOG_COLORS.success}${LOG_ICONS.success} ${msg}${COLORS.reset}`, ...args)
  },
  
  /**
   * Warning message (yellow)
   */
  warn: (msg: string, ...args: unknown[]) => {
    console.log(`${LOG_COLORS.warn}${LOG_ICONS.warn} ${msg}${COLORS.reset}`, ...args)
  },
  
  /**
   * Error message (red)
   */
  error: (msg: string, ...args: unknown[]) => {
    console.error(`${LOG_COLORS.error}${LOG_ICONS.error} ${msg}${COLORS.reset}`, ...args)
  },
  
  /**
   * Section header
   */
  section: (title: string) => {
    console.log(`\n${COLORS.bright}${COLORS.magenta}═══ ${title} ═══${COLORS.reset}\n`)
  },
  
  /**
   * Stats/metrics
   */
  stats: (label: string, value: string | number) => {
    console.log(`${COLORS.dim}   ${label}:${COLORS.reset} ${COLORS.bright}${value}${COLORS.reset}`)
  },
}

/**
 * Simple progress indicator
 */
export class ProgressLogger {
  private start: number
  private step = 0
  private total: number
  
  constructor(total: number) {
    this.total = total
    this.start = Date.now()
  }
  
  next(message: string) {
    this.step++
    const percent = Math.round((this.step / this.total) * 100)
    console.log(`${COLORS.cyan}[${this.step}/${this.total}]${COLORS.reset} ${message} ${COLORS.dim}(${percent}%)${COLORS.reset}`)
  }
  
  complete(message: string) {
    const duration = ((Date.now() - this.start) / 1000).toFixed(2)
    logger.success(`${message} ${COLORS.dim}(${duration}s)${COLORS.reset}`)
  }
}

