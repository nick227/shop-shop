/**
 * Simple logger utility for the application
 * Provides consistent logging interface across the app
 */

export interface Logger {
  debug: (message: string, data?: any) => void
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, data?: any) => void
}

class AppLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  }

  info(message: string, data?: any): void {
    console.log(`[INFO] ${message}`, data || '')
  }

  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '')
  }

  error(message: string, data?: any): void {
    console.error(`[ERROR] ${message}`, data || '')
  }
}

export const logger = new AppLogger()

export default logger
