// @ts-check
import { test, expect } from '@playwright/test';

// Fecha futura al azar (30-700 días) para que el slot no choque entre ejecuciones (constraint única fecha+hora).
function randomFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 670));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const slotButtons = (page) => page.getByRole('button', { name: /^\d{2}:\d{2}$/ });

/** Avanza servicio -> mascota -> extras -> fecha/hora. Devuelve el horario elegido. */
async function fillUntilContact(page, { date, slot } = {}) {
  const next = page.getByRole('button', { name: /Continuar/ });
  await page.goto('/reservar');
  await page.getByRole('button', { name: /Peluquería canina/ }).click();
  await next.click();

  await page.getByLabel('Nombre de tu mascota').fill(`Frida-${Date.now()}`);
  await page.getByLabel('Raza').fill('Caniche');
  await next.click();

  await next.click(); // extras: ninguno

  // Se espera la disponibilidad antes de elegir, porque el cliente descarta horarios ocupados.
  const availability = page.waitForResponse((r) => r.url().includes('/api/reservations/availability'));
  await page.getByLabel('Fecha').fill(date);
  await availability;
  const option = slot
    ? page.getByRole('button', { name: slot, exact: true })
    : slotButtons(page).and(page.locator(':enabled')).first();
  const chosen = slot ?? (await option.innerText()).trim();
  await option.click();
  await next.click();
  return chosen;
}

async function fillContact(page) {
  await page.getByLabel('Tu nombre').fill('Camila Peralta');
  await page.getByLabel('Teléfono').fill('555 123 4567');
  await page.getByLabel('Correo electrónico').fill(`e2e-${Date.now()}@example.com`);
}

test('cada paso exige sus datos antes de avanzar', async ({ page }) => {
  const next = page.getByRole('button', { name: /Continuar/ });
  await page.goto('/reservar');
  await next.click(); // servicio (preseleccionado)

  // Mascota
  await expect(next).toBeDisabled();
  await page.getByLabel('Nombre de tu mascota').fill('Frida');
  await expect(next).toBeDisabled();
  await page.getByLabel('Raza').fill('Caniche');
  await expect(next).toBeEnabled();
  await next.click();
  await next.click(); // extras

  // Fecha y hora: sin hora elegida no se avanza
  await expect(next).toBeDisabled();
  const availability = page.waitForResponse((r) => r.url().includes('/api/reservations/availability'));
  await page.getByLabel('Fecha').fill(randomFutureDate());
  await availability;
  await expect(next).toBeDisabled();
  await slotButtons(page).and(page.locator(':enabled')).first().click();
  await expect(next).toBeEnabled();
  await next.click();

  // Contacto: los tres datos son obligatorios
  const confirm = page.getByRole('button', { name: /Confirmar reserva/ });
  await expect(confirm).toBeDisabled();
  await page.getByLabel('Tu nombre').fill('Camila Peralta');
  await page.getByLabel('Teléfono').fill('555 123 4567');
  await expect(confirm).toBeDisabled();
  await page.getByLabel('Correo electrónico').fill('e2e@example.com');
  await expect(confirm).toBeEnabled();
});

test('si otro cliente toma el horario, se avisa y se vuelve a elegir', async ({ browser }) => {
  const date = randomFutureDate();
  const context = await browser.newContext();
  const a = await context.newPage();
  const b = await context.newPage();

  const slot = await fillUntilContact(a, { date });
  await fillUntilContact(b, { date, slot });
  await fillContact(a);
  await fillContact(b);

  await a.getByRole('button', { name: /Confirmar reserva/ }).click();
  await expect(a.getByRole('heading', { name: '¡Cita reservada!' })).toBeVisible();

  await b.getByRole('button', { name: /Confirmar reserva/ }).click();
  await expect(b.getByText('Ese horario acaba de ser reservado')).toBeVisible();
  await expect(b.getByLabel('Fecha')).toHaveValue(date);
  await expect(b.getByRole('button', { name: slot, exact: true })).toBeDisabled();
  await expect(b.getByRole('heading', { name: '¡Cita reservada!' })).toBeHidden();

  await context.close();
});

test('tras un error 500 el reintento confirma con la misma clave de idempotencia', async ({ page }) => {
  await fillUntilContact(page, { date: randomFutureDate() });
  await fillContact(page);

  const keys = [];
  let calls = 0;
  await page.route('**/api/reservations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    keys.push(route.request().postDataJSON().idempotencyKey);
    calls += 1;
    if (calls === 1) {
      return route.fulfill({ status: 500, json: { error: 'INTERNAL_ERROR' } });
    }
    return route.continue();
  });

  await page.getByRole('button', { name: /Confirmar reserva/ }).click();
  await expect(page.getByText('Tuvimos un problema al guardar tu reserva')).toBeVisible();

  await page.getByRole('button', { name: /Confirmar reserva/ }).click();
  await expect(page.getByRole('heading', { name: '¡Cita reservada!' })).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
});

test('un doble clic en confirmar envía una sola reserva', async ({ page }) => {
  await fillUntilContact(page, { date: randomFutureDate() });
  await fillContact(page);

  let posts = 0;
  await page.route('**/api/reservations', async (route) => {
    if (route.request().method() === 'POST') {
      posts += 1;
      // Respuesta lenta para que el segundo clic ocurra mientras la primera petición sigue en vuelo.
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await route.continue();
  });

  await page.getByRole('button', { name: /Confirmar reserva/ }).dblclick();
  await expect(page.getByRole('heading', { name: '¡Cita reservada!' })).toBeVisible();
  expect(posts).toBe(1);
});
