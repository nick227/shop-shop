import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * Comprehensive testing for all user roles and critical paths
 */
process.env.VITE_PORT ||= '5187'
process.env.VITE_API_URL ||= 'http://localhost:3015'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  
  use: {
    baseURL: `http://localhost:${process.env.VITE_PORT || 5187}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: [
    {
      // Backend API (required for true E2E)
      command: 'cmd /c "set PORT=3015&& pnpm -C apps/server dev"',
      url: 'http://localhost:3015/healthz',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // Vite dev server (explicit port for deterministic baseURL)
      command:
        'cmd /c "set VITE_API_URL=http://localhost:3015&& pnpm -C apps/web exec vite --port 5187 --strictPort"',
      url: 'http://localhost:5187',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
})


