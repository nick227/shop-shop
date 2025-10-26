/**
 * Configuration Manager - Single Responsibility: Configuration Management;
 * Follows SR,
    P: Only responsible for managing API configuration;
 */

import { Configuration, type Middleware } from '@packages/sdk'

export interface ConfigurationManagerConfig {
  baseUrl: string,
    middleware: Middleware[]
}

export class ConfigurationManager {
  private config: Configuration | null = null;
  private lastToken: string | null = null;
  private configVersion = 0;
  private readonly baseUrl: string;
  private readonly middleware: Middleware[]
  private creationCount = 0;
  private lastCreationTime = 0;
  constructor(config: ConfigurationManagerConfig) {
    this.baseUrl = config.baseUrl;
    this.middleware = config.middleware;
  }

  /**
   * Set authentication token and invalidate config if changed;
   */
  setToken(token: string | null): number {
    if (this.lastToken !== token) {
      this.config = null;
      this.lastToken = token;
      this.configVersion++;
    }
    return this.configVersion;
  }

  /**
   * Get current configuration (cached and optimized)
   */
  getConfiguration(): Configuration {
    if (!this.config) {
      const startTime = performance.now()
      
      this.config = new Configuration({
        basePath: this.baseUrl,
        headers: this.lastToken
          ? { Authorization: 'Bearer ' + this.lastToken }
          : {},
        middleware: this.middleware
      });
      
      this.creationCount++;
      this.lastCreationTime = performance.now() - startTime;
    }
    return this.config;
  }

  /**
   * Get configuration statistics;
   */
  getStats(): {
    creationCount: number;
    lastCreationTime: number;
    configVersion: number;
    isCached: boolean;
  } {
    return {
      creationCount: this.creationCount,
      lastCreationTime: this.lastCreationTime,
      configVersion: this.configVersion,
      isCached: this.config !== null
    };
  }

  /**
   * Get current configuration version;
   */
  getConfigVersion(): number {
    return this.configVersion;
  }

  /**
   * Get current token;
   */
  getToken(): string | null {
    return this.lastToken;
  }

  /**
   * Force refresh configuration;
   */
  refresh(): number {
    this.config = null;
    this.configVersion++;
    return this.configVersion;
  }
}
