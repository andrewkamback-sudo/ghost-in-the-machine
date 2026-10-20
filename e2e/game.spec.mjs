// A full offline run to FREED, keyboard only, in every engine on every OS.
import { test, expect } from '@playwright/test';

// The story asks for the real-machine haunts as it goes (voice, notifications, a file,
// a window, the camera). This player says no to each, like a cautious player would.
function declineAsks(page) {
  const timer = setInterval(() => {
    page.evaluate(() => {
      const d = document.getElementById('dialog');
      const title = document.getElementById('dialog-title')?.textContent;
      if (!d?.open || title === 'Confirm' || !d.matches(':modal')) return;
      const first = d.querySelector('#dialog-buttons button');
      if (first && !first.disabled && first.textContent !== 'OK') first.click();
    }).catch(() => {});
  }, 250);
  return () => clearInterval(timer);
}

test('boot to FREED offline, by keyboard', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/?demo=1&offline=1');
  const stop = declineAsks(page);

  await page.keyboard.press('Space'); // skip the BIOS screen
  await page.locator('#name').fill('José');
  await page.locator('#name').press('Enter'); // Next
  await page.locator('#setup-next').click(); // Boot
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
  await expect(page.locator('#icon-note')).toBeVisible({ timeout: 30_000 });
  await page.locator('#icon-note').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#note-answer')).toBeVisible();
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
  const [ics] = await Promise.all([page.waitForEvent('download'), page.locator('#end-cal').click()]);
  expect(ics.suggestedFilename()).toBe('wren-3am.ics');
  await expect(page.locator('#end-manifest')).toContainText('her 3:00 AM event');
  stop();
  expect(errors).toEqual([]);
});

test('sound: audio is running and audible after boot, and Sound off silences it', async ({ page }) => {
  await page.goto('/?offline=1&nopost=1');
  await page.locator('#name').fill('Sam');
  await page.locator('#name').press('Enter');
  await page.locator('#setup-next').click(); // the Boot click starts audio
  await page.waitForTimeout(1500);
  const on = await page.evaluate(async () => (await import('/sfx.js')).debug());
  expect(on.state).toBe('running');
  expect(on.rms).toBeGreaterThan(0.005);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.locator('label[for=sound-tray]').click();
  await page.waitForTimeout(800);
  const off = await page.evaluate(async () => (await import('/sfx.js')).debug());
  expect(off.muted).toBe(true);
  expect(off.rms).toBeLessThan(0.002);
});

test('sound: the end card fades the hum to silence', async ({ page }) => {
  await page.goto('/?offline=1&nopost=1');
  await page.locator('#name').fill('Sam');
  await page.locator('#name').press('Enter');
  await page.locator('#setup-next').click();
  await page.waitForTimeout(1000);
  await page.evaluate(async () => (await import('/sfx.js')).fadeOut(0.4));
  await page.waitForTimeout(1500);
  const off = await page.evaluate(async () => (await import('/sfx.js')).debug());
  expect(off.rms).toBeLessThan(0.01);
});
