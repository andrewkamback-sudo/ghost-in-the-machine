// A full offline run to FREED, keyboard only, in every engine on every OS.
import { test, expect } from '@playwright/test';

test('boot to FREED offline, by keyboard', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/?demo=1&offline=1');

  await page.locator('#name').fill('José');
  await page.locator('#name').press('Enter');
  await page.getByRole('button', { name: 'OK' }).click(); // the maintenance dialog
  const log = page.locator('#chat-log');
  await expect(log).toContainText('Want me to repair her diary?', { timeout: 30_000 });
  await page.waitForTimeout(500);

  // A typed yes repairs the diary; opening it starts Act 2.
  await page.locator('#chat-input').fill('yes please');
  await page.locator('#chat-input').press('Enter');
  await expect(log).toContainText("It's in C:\\WREN", { timeout: 20_000 });
  await page.locator('#icon-wren').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#note-text')).toContainText('Wren Adair, PAL lead engineer');

  // Act 2: the red text, then WREN.TXT in the in-game Notepad (no real folder offered here).
  await expect(log).toContainText("it's lying. i never left.", { timeout: 30_000 });
  await expect(page.locator('#note-answer')).toBeVisible({ timeout: 30_000 });
  await page.locator('#note-input').fill('yes, I believe you');
  await page.locator('#note-save').click();

  // Two clues in demo mode: THE POSSESSION, then the cracked icon.
  await expect(page.locator('#icon-pal')).toHaveClass(/cracked/, { timeout: 60_000 });
  await expect(page.locator('#note-text')).toContainText('the cracked one');
  await page.waitForTimeout(1000);

  // Bin PAL with the Delete key, then empty the bin and confirm.
  await page.locator('#icon-pal').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('#icon-bin')).toHaveClass(/full/);
  await page.locator('#icon-bin').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Empty Recycle Bin' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();

  await expect(page.locator('#end')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#end-title')).toHaveText('FREED');
  await expect(page.locator('#end-manifest')).toContainText('Emptying it deleted nothing on your computer');
  expect(errors).toEqual([]);
});
