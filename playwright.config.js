// @ts-check
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig, devices } from '@playwright/test';

// Los E2E escriben reservas reales: usan SIEMPRE la branch Neon de desarrollo definida en .env.e2e
// (nunca la de producción de .env.local). Las variables del proceso tienen prioridad sobre los .env de Next.
// En CI no existe .env.e2e: la branch de desarrollo llega por secrets del Environment `e2e` de GitHub.
let e2eEnv;
if (process.env.CI && process.env.DATABASE_URL) {
  e2eEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  };
} else {
  try {
    e2eEnv = parseEnv(readFileSync('.env.e2e', 'utf8'));
  } catch {
    throw new Error('Falta .env.e2e con DATABASE_URL de la branch Neon de desarrollo. Los E2E no corren contra producción.');
  }
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
    // En CI se prueba el build de producción (lo mismo que se despliega); en local, el dev server.
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    // false a propósito: un dev server ya levantado podría apuntar a la DB de producción.
    reuseExistingServer: false,
    timeout: 180_000,
    env: e2eEnv,
  },
});
