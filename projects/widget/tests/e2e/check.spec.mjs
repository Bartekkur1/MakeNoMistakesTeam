import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';

const url = 'http://127.0.0.1:4173/chat-like.html';
const honest = 'Dziś gramy o 17, spotkajmy się w naszej grupie';
const safety = 'Zanim sprawdzimy: nie podawaj hasła ani kodu i nie klikaj nieznanego linku.';
const summary = 'Nie widzę typowych sygnałów oszustwa. To nie daje pewności — sprawdź wiadomość oficjalnym kanałem.';

async function approve(page, serviceWorker, text = honest) {
  await page.goto(url);
  await page.getByRole('button', { name: 'Scamerinio', exact: true }).click();
  await page.getByRole('button', { name: 'Sprawdź wiadomość', exact: true }).click();
  await page.getByRole('textbox', { name: 'Wiadomość', exact: true }).fill(text);
  await page.getByRole('button', { name: 'Dalej', exact: true }).click();
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  await page.getByRole('button', { name: 'Zatwierdzam', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Scamerinio', exact: true });
  await expect(dialog).toContainText(safety);
  await expect(dialog.getByRole('group')).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  expect(await serviceWorker.evaluate(() => self.__aura.cases)).toMatchObject([{ content: text, origin: 'paste' }]);
  return dialog;
}

async function untouchedQuestion(dialog, title) {
  await expect(dialog.getByRole('group', { name: title, exact: true })).toBeVisible();
  await expect(dialog.getByRole('group')).toHaveCount(1);
  await expect(dialog.locator('input:checked')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Dalej', exact: true })).toBeDisabled();
}

test('honest approval reaches three deliberate questions and a limited-confidence result', async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker);
  const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
  await next.click();
  await untouchedQuestion(dialog, 'Kto wysłał wiadomość?');
  await dialog.getByLabel('Osoba, którą znam', { exact: true }).check();
  await next.click();
  await untouchedQuestion(dialog, 'Czego chce nadawca i czy pogania?');
  await dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true }).check();
  await next.click();
  await untouchedQuestion(dialog, 'Jak możesz sprawdzić poza tą wiadomością?');
  await dialog.getByLabel('Przez znaną mi aplikację, stronę lub kontakt', { exact: true }).check();
  await next.click();
  await expect(dialog).toContainText(summary);
  for (const heading of ['Co zwraca uwagę', 'Czego jeszcze nie wiemy', 'Co możesz teraz zrobić']) {
    await expect(dialog.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(dialog.locator('.result-step')).toHaveCount(1);
  await expect(dialog.locator('.result-step')).toContainText('Otwórz znaną Ci oficjalną aplikację lub stronę bezpośrednio albo skontaktuj się z nadawcą przez wcześniej znany kontakt.');
  await expect(dialog.getByRole('group')).toHaveCount(0);
  await expect(dialog.getByRole('link')).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});

test('explicit unknown answers advance and explain missing information', async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker);
  const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
  await next.click();
  for (const title of ['Kto wysłał wiadomość?', 'Czego chce nadawca i czy pogania?', 'Jak możesz sprawdzić poza tą wiadomością?']) {
    await untouchedQuestion(dialog, title);
    await dialog.getByLabel('Nie wiem', { exact: true }).check();
    await expect(next).toBeEnabled();
    await next.click();
  }
  await expect(dialog).toContainText('Nie wiemy jeszcze, kto naprawdę wysłał wiadomość.');
  await expect(dialog).toContainText('Nie wiemy jeszcze, czego nadawca oczekuje.');
  await expect(dialog).toContainText('Nie wiemy jeszcze, jak sprawdzić wiadomość niezależnie.');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});

test('request choices allow multiple signals without treating hints as answers', async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker, 'Podaj kod do konta i zapłać teraz.');
  const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
  await next.click();
  await dialog.getByLabel('Nie wiem', { exact: true }).check();
  await next.click();
  await untouchedQuestion(dialog, 'Czego chce nadawca i czy pogania?');
  await expect(dialog.getByText('Podpowiedź z wiadomości', { exact: true }).first()).toBeVisible();
  await dialog.getByLabel('Podania kodu do konta', { exact: true }).check();
  await dialog.getByLabel('Zapłaty lub przelewu', { exact: true }).check();
  await expect(dialog.locator('input:checked')).toHaveCount(2);
  await next.click();
  await dialog.getByLabel('Nie wiem', { exact: true }).check();
  await next.click();
  await expect(dialog).toContainText('Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.');
  await expect(dialog).toContainText('Prośba o zapłatę wymaga sprawdzenia poza wiadomością.');
  await expect(dialog).not.toContainText(summary);
  await expect(dialog.locator('.result-step')).toHaveCount(1);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});
