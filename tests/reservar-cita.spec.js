// @ts-check
import { test, expect } from '@playwright/test';

// Fecha futura al azar (30-700 días) para que el slot no choque entre ejecuciones (constraint única fecha+hora).
function randomFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30 + Math.floor(Math.random() * 670));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test('el cliente reserva una cita de punta a punta', async ({ page }) => {
  const run = Date.now();
  const petName = `Frida-${run}`;
  const next = page.getByRole('button', { name: /Continuar/ });

  await page.goto('/reservar');

  // 1. Servicio
  await expect(page.getByRole('heading', { name: 'Elige el ritual' })).toBeVisible();
  await page.getByRole('button', { name: /Peluquería canina/ }).click();
  await next.click();

  // 2. Mascota
  await page.getByLabel('Nombre de tu mascota').fill(petName);
  await page.getByLabel('Raza').fill('Caniche');
  await page.getByRole('button', { name: 'Pequeño', exact: true }).click();
  await next.click();

  // 3. Extras
  await page.getByRole('button', { name: /Mascarilla de Arándanos/ }).click();
  await next.click();

  // 4. Fecha y hora: se espera la disponibilidad antes de elegir, porque el cliente descarta horarios ocupados.
  const availability = page.waitForResponse((r) => r.url().includes('/api/reservations/availability'));
  await page.getByLabel('Fecha').fill(randomFutureDate());
  await availability;
  await page
    .getByRole('button', { name: /^\d{2}:\d{2}$/ })
    .and(page.locator(':enabled'))
    .first()
    .click();
  await next.click();

  // 5. Contacto
  await page.getByLabel('Tu nombre').fill('Camila Peralta');
  await page.getByLabel('Teléfono').fill('555 123 4567');
  await page.getByLabel('Correo electrónico').fill(`e2e-${run}@example.com`);
  await expect(page.getByText('Peluquería canina').first()).toBeVisible();
  await expect(page.getByText(`${petName} (Caniche, Pequeño)`)).toBeVisible();
  await expect(page.getByText('+ Mascarilla de Arándanos')).toBeVisible();
  await page.getByRole('button', { name: /Confirmar reserva/ }).click();

  // 6. Confirmación
  await expect(page.getByRole('heading', { name: 'ROMPER A PROPÓSITO' })).toBeVisible();
  await expect(page.getByText(`Peluquería canina para ${petName} (Caniche, Pequeño)`)).toBeVisible();
});
