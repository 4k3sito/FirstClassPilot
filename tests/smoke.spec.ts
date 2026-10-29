import { test, expect } from '@playwright/test';

// Happy path a client demo walks through: home → product → cart → checkout → confirmation.
test('purchase flow computes totals and confirms the order', async ({ page }) => {
  await page.goto('/');
  await page.locator('#coleccion').getByRole('link', { name: /Camisa Piloto Manga Larga/ }).click();

  // Adding without a size must be blocked with a visible error.
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await expect(page.getByRole('alert')).toHaveText(/Selecciona una talla/);

  await expect(page.getByRole('radio', { name: /XXL/ })).toBeDisabled();
  await page.getByRole('radio', { name: 'M', exact: true }).check({ force: true });
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await expect(page.getByRole('heading', { name: 'Agregado al carrito' })).toBeVisible();
  await page.getByRole('link', { name: /Ver carrito/ }).click();

  // 1 × $64 → standard shipping $8 (under the $100 free threshold).
  await expect(page.getByTestId('subtotal')).toHaveText(/64\.00/);
  await expect(page.getByTestId('total')).toHaveText(/72\.00/);
  await page.getByRole('button', { name: 'Agregar uno' }).click();
  // 2 × $64 = $128 → free shipping.
  await expect(page.getByTestId('total')).toHaveText(/128\.00/);

  await page.getByRole('link', { name: 'Continuar al pago' }).click();
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await expect(page.getByLabel(/Correo electrónico/)).toBeFocused();

  await page.getByLabel(/Correo electrónico/).fill('piloto@example.com');
  await page.getByLabel(/Nombre completo/).fill('Ana Piloto');
  await page.getByLabel(/^Dirección/).fill('123 Runway Ave');
  await page.getByLabel(/Ciudad/).fill('Houston');
  await page.getByLabel(/Código postal/).fill('77001');
  await page.getByLabel(/^Estado/).fill('TX');
  await page.getByText('Express').click();
  await expect(page.getByTestId('total')).toHaveText(/148\.00/);

  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await expect(page.getByTestId('order-no')).toHaveText(/^FCP-\d{6}$/);
  await expect(page.locator('#cart-badge')).toBeHidden();
});

test('unknown product id shows a recoverable empty state', async ({ page }) => {
  await page.goto('/product.html?id=nope');
  await expect(page.getByRole('heading', { name: 'Producto no encontrado' })).toBeVisible();
});

test('no horizontal scroll', async ({ page }) => {
  for (const path of ['/', '/product.html?id=manga-corta', '/cart.html', '/checkout.html']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('switching to Mexico reprices in MXN with MX shipping rules', async ({ page }) => {
  await page.goto('/product.html?id=manga-corta');
  await expect(page.locator('.pdp-panel .price')).toHaveText('$58.00 USD');
  await page.locator('#market-select').selectOption('MX');
  await expect(page.locator('.pdp-panel .price')).toHaveText('$1,050.00 MXN');

  await page.getByRole('radio', { name: 'L', exact: true }).check({ force: true });
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('/cart.html');
  // 1,050 < 1,800 free threshold → MX standard shipping 149.
  await expect(page.getByTestId('total')).toHaveText('$1,199.00 MXN');
});

test('Canadian checkout validates postal code format and labels Provincia', async ({ page }) => {
  await page.goto('/product.html?id=manga-larga');
  await page.getByRole('radio', { name: 'S', exact: true }).check({ force: true });
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('/checkout.html');
  await page.locator('#country').selectOption('CA');
  await expect(page.getByLabel(/^Provincia/)).toBeVisible();
  await expect(page.getByTestId('subtotal')).toHaveText('$88.00 CAD');

  const zip = page.getByLabel(/Código postal/);
  await zip.fill('77001');
  await zip.blur();
  await expect(page.locator('#zip-error')).not.toBeEmpty();
  await zip.fill('M5V 2T6');
  await zip.blur();
  await expect(page.locator('#zip-error')).toBeEmpty();
});

test('tampered or corrupt cart storage is discarded instead of breaking or injecting', async ({ page }) => {
  await page.goto('/');
  for (const raw of ['{}', '5', '"x"', JSON.stringify([
    { id: 'manga-larga', size: '<img src=x onerror=window.__xss=1>', color: 'Blanco', qty: 1 },
    { id: 'nope', size: 'M', color: 'Blanco', qty: 1 },
    { id: 'manga-larga', size: 'M', color: 'Blanco', qty: -3 },
  ])]) {
    await page.evaluate((v) => localStorage.setItem('fcp-cart', v), raw);
    await page.goto('/cart.html');
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
    await expect(page.locator('#cart-badge')).toBeHidden();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  }
});
