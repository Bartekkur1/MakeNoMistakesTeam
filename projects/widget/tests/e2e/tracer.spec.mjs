import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
import { STRINGS } from '../../src/ui/strings.pl.js';

const url = 'http://127.0.0.1:4173/chat-like.html';
const guardianNotice = 'Gdy zatwierdzisz, tę wiadomość i wynik sprawdzania zobaczy Twój opiekun.';

test('zaznaczenie → podgląd → zatwierdzenie; nic nie wysłane wcześniej', async ({ page, serviceWorker, netlog }) => {
  await page.goto(url);
  const message = await page.locator('#msg').textContent();
  await page.locator('#msg').selectText();
  await page.waitForTimeout(500);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  await page.getByRole('button', { name: 'Scamerinio', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Scamerinio', exact: true });
  await expect(dialog).toBeVisible();
  const box = page.getByRole('textbox', { name: 'Wiadomość', exact: true });
  await expect(box).toHaveValue(message);
  await expect(page.getByText('Ze strony: 127.0.0.1', { exact: true })).toBeVisible();
  await expect(page.getByText(guardianNotice, { exact: true })).toBeVisible();
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  const approve = page.getByRole('button', { name: 'Zatwierdzam', exact: true });
  await expect(approve).toHaveCSS('background-color', 'rgb(15, 98, 219)');
  await expect(dialog).toHaveCSS('border-radius', '20px');
  const edited = 'Darmowe Nitro! Kliknij szybko: https://discord-nitro-free.example/gift';
  await box.fill(edited);
  await approve.click();
  await expect(page.getByText(STRINGS.safetyNotice, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: STRINGS.next, exact: true })).toBeVisible();
  const cases = await serviceWorker.evaluate(() => self.__aura.cases);
  expect(cases).toHaveLength(1);
  expect(cases[0]).toMatchObject({ content: edited, source: '127.0.0.1', origin: 'selection' });
  expect(Object.keys(cases[0]).sort()).toEqual(['content', 'link', 'origin', 'source', 'created_at', 'truncated'].sort());
  const messages = await serviceWorker.evaluate(() => self.__aura.messages);
  expect(messages).toHaveLength(1);
  expect(messages[0].type).toBe('aura/case-approved');
  await assertOnlyLocal(netlog);
});

test('zamknięcie okna zachowuje szkic', async ({ page, serviceWorker, netlog }) => {
  await page.goto(url);
  await page.locator('#msg').selectText();
  await page.getByRole('button', { name: 'Scamerinio', exact: true }).click();
  const box = page.getByRole('textbox', { name: 'Wiadomość', exact: true });
  await box.fill('Darmowe Nitro!');
  await page.getByRole('button', { name: 'Zamknij okno', exact: true }).click();
  await page.evaluate(() => getSelection().removeAllRanges());
  await page.getByRole('button', { name: 'Scamerinio', exact: true }).click();
  await expect(box).toHaveValue('Darmowe Nitro!');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  await assertOnlyLocal(netlog);
});

test('pisanie w podglądzie nie trafia do strony', async ({ page, netlog }) => {
  await page.goto(url);
  await page.locator('#msg').selectText();
  await page.getByRole('button', { name: 'Scamerinio', exact: true }).click();
  await page.getByRole('textbox', { name: 'Wiadomość', exact: true }).pressSequentially('test');
  await expect(page.locator('#keylog')).toHaveText('');
  await assertOnlyLocal(netlog);
});
