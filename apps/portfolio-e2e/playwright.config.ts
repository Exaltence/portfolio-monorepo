import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        command: 'npm exec nx run portfolio:serve',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
        cwd: workspaceRoot,
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
  ],
});
