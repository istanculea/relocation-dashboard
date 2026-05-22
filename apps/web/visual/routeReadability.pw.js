import { expect, test } from '@playwright/test';

const selectOptionByIndex = async (page, selector, index = 1) => {
  const select = page.locator(selector).first();
  const value = await select.locator('option').nth(index).getAttribute('value');
  await select.selectOption(value ?? '');
  return value;
};

const assertWrappingTypography = async (locator, description) => {
  await expect(locator, `${description} should exist`).toBeVisible();

  const styles = await locator.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      whiteSpace: computed.whiteSpace,
      textOverflow: computed.textOverflow,
      overflowX: computed.overflowX,
    };
  });

  expect(styles.whiteSpace, `${description} should not force nowrap`).not.toBe('nowrap');
  expect(styles.textOverflow, `${description} should not truncate with ellipsis`).not.toBe('ellipsis');
  expect(styles.overflowX, `${description} should allow wrapping`).not.toBe('hidden');
};

test.describe('route readability guards', () => {
  test('future outlook cards keep multiline readable typography', async ({ page }) => {
    await page.goto('/#/outlook');
    await page.getByText('Future Outlook').waitFor();

    await selectOptionByIndex(page, 'select');
    await page.getByRole('combobox').nth(1).selectOption('heatwave');

    await assertWrappingTypography(
      page.locator('.outlook-signal-card .ws-atlas-deck__label').first(),
      'Outlook signal label',
    );
    await assertWrappingTypography(
      page.locator('.outlook-signal-card strong').first(),
      'Outlook signal title',
    );
    await assertWrappingTypography(
      page.locator('.outlook-signal-card small').first(),
      'Outlook signal detail',
    );
    await assertWrappingTypography(
      page.locator('.outlook-top-cities__card .ws-atlas-deck__label').first(),
      'Outlook top-city label',
    );
    await assertWrappingTypography(
      page.locator('.outlook-top-cities__card small').first(),
      'Outlook top-city detail',
    );
    await assertWrappingTypography(
      page.locator('.outlook-alternatives__card small').first(),
      'Outlook alternatives detail',
    );
  });

  test('family fit cards keep multiline readable typography', async ({ page }) => {
    await page.goto('/#/family-fit');
    await page.getByText('Family Fit Explorer').waitFor();

    await selectOptionByIndex(page, 'select', 2);
    await page.getByRole('button', { name: 'Energetic & Ambitious' }).click();

    await assertWrappingTypography(
      page.locator('.family-fit-summary__card .ws-atlas-deck__label').first(),
      'Family fit summary label',
    );
    await assertWrappingTypography(
      page.locator('.family-fit-summary__card small').first(),
      'Family fit summary detail',
    );
    await assertWrappingTypography(
      page.locator('.family-fit-narrative__card strong').first(),
      'Family fit narrative body',
    );
    await assertWrappingTypography(
      page.locator('.family-fit-best-matches__card small').first(),
      'Family fit best-match detail',
    );
    await assertWrappingTypography(
      page.locator('.family-fit-compatibility__card small').first(),
      'Family fit compatibility detail',
    );
  });
});
