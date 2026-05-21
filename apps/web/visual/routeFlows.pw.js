import { expect, test } from '@playwright/test';

const selectOptionByIndex = async (page, selector, index = 1) => {
  const select = page.locator(selector).first();
  const value = await select.locator('option').nth(index).getAttribute('value');
  await select.selectOption(value ?? '');
  return value;
};

const setRangeValue = async (page, selector, index, value) => {
  await page.locator(selector).nth(index).evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
};

test.describe('route flow visuals', () => {
  test('map route baseline', async ({ page }) => {
    await page.goto('/#/map');
    await page.getByText('European Strategic Atlas').waitFor();

    await selectOptionByIndex(page, '#city-map-picker-compact');
    await selectOptionByIndex(page, '#city-map-comparison-picker', 2);
    await page.locator('#city-map-neighbor-count').selectOption('5');
    await page.getByRole('button', { name: 'Career Acceleration' }).click();
    await page.getByRole('button', { name: 'Startup Founder' }).click();

    await expect(page.locator('.city-map-shell')).toHaveScreenshot('map-route.png');
  });

  test('outlook route baseline', async ({ page }) => {
    await page.goto('/#/outlook');
    await page.getByText('Future Outlook').waitFor();

    await selectOptionByIndex(page, 'select');
    await page.getByRole('combobox').nth(1).selectOption('heatwave');
    await setRangeValue(page, 'input[type="range"]', 0, 2029);
    await setRangeValue(page, 'input[type="range"]', 1, 1.6);

    await expect(page.locator('.explorer-page-shell')).toHaveScreenshot('outlook-route.png');
  });

  test('family fit route baseline', async ({ page }) => {
    await page.goto('/#/family-fit');
    await page.getByText('Family Fit Explorer').waitFor();

    await selectOptionByIndex(page, 'select', 2);
    await page.getByRole('button', { name: 'Energetic & Ambitious' }).click();

    await expect(page.locator('.explorer-page-shell')).toHaveScreenshot('family-fit-route.png');
  });
});