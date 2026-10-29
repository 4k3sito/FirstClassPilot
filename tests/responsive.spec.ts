import { test, expect, type Page } from '@playwright/test';

// Layout guards across common phone/tablet widths: no horizontal scroll, header items never collide,
// and tap targets meet the 44px minimum. Viewport is set per width, so one project is enough.
const WIDTHS = [320, 360, 375, 390, 414, 430, 480, 560, 768, 1024] as const;
const PAGES = ['/', '/product.html?id=manga-larga', '/cart.html', '/checkout.html'] as const;

test.beforeEach(({}, testInfo) => { test.skip(testInfo.project.name !== 'desktop', 'viewports are set explicitly'); });

async function seedCart(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('fcp-cart', JSON.stringify([{ id: 'manga-larga', size: 'M', color: 'Blanco', qty: 1 }])));
}

for (const width of WIDTHS) {
  test(`layout holds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await seedCart(page);

    for (const path of PAGES) {
      await page.goto(path);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} horizontal scroll`).toBeLessThanOrEqual(0);

      const [brand, nav] = await Promise.all([page.locator('.brand').boundingBox(), page.locator('.site-header .nav').boundingBox()]);
      expect(brand && nav, 'header rendered').toBeTruthy();
      expect(brand!.x + brand!.width, `${path} brand overlaps nav`).toBeLessThanOrEqual(nav!.x);

      // Text must not spill out of the brand box (nowrap + shrinking container).
      const spill = await page.locator('.brand-text').evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(spill, `${path} brand text clipped`).toBeLessThanOrEqual(1);

      const smallTargets = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.btn, .icon-btn, select, .option > span, .field input, .radio-card, .market select')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ el: el.className || el.tagName, ...el.getBoundingClientRect().toJSON() }))
          .filter((r) => r.height < 44 || r.width < 44)
          .map((r) => `${r.el} ${Math.round(r.width)}x${Math.round(r.height)}`));
      expect(smallTargets, `${path} tap targets < 44px`).toEqual([]);
    }
  });
}
