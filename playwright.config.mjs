import { defineConfig, devices } from '@playwright/test';

// Runs on Windows, Linux and macOS in CI (.github/workflows/e2e.yml).
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.spec.mjs',
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1280, height: 800 } },
  webServer: { command: 'node e2e/serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ...(process.env.EDGE ? [{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } }] : []),
  ],
});
