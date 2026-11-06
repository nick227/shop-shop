import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  testMatch: 'discovery-navigation.spec.ts',
  use: { baseURL: 'http://localhost:5198' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: { command: 'pnpm exec vite --host 127.0.0.1 --port 5198', url: 'http://localhost:5198', reuseExistingServer: true },
})
