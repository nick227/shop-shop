/**
 * Simple logger utility for the application
 * Provides consistent logging interface across the app
 */

export interface Logger {
  debug: (message: string, data?: unknown) => void
  info: (message: string, data?: unknown) => void
  warn: (message: string, data?: unknown) => void
  error: (message: string, data?: unknown) => void
}

class AppLogger implements Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development'

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  }

  info(message: string, data?: unknown): void {
    console.log(`[INFO] ${message}`, data || '')
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data || '')
  }

  error(message: string, data?: unknown): void {
    console.error(`[ERROR] ${message}`, data || '')
  }
}

export const logger = new AppLogger()

export default logger
