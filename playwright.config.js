// @ts-check
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig, devices } from '@playwright/test';

// Los E2E escriben reservas reales: usan SIEMPRE la branch Neon de desarrollo definida en .env.e2e
// (nunca la de producción de .env.local). Las variables del proceso tienen prioridad sobre los .env de Next.
let e2eEnv;
try {
  e2eEnv = parseEnv(readFileSync('.env.e2e', 'utf8'));
} catch {
  throw new Error('Falta .env.e2e con DATABASE_URL de la branch Neon de desarrollo. Los E2E no corren contra producción.');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // false a propósito: un dev server ya levantado podría apuntar a la DB de producción.
    reuseExistingServer: false,
    env: e2eEnv,
  },
});
