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

for (const branch of ['retain', 'correct']) {
  test(`credential discrepancy ${branch} preserves the warning through the real controller`, async ({ page, serviceWorker, netlog }) => {
    const dialog = await approve(page, serviceWorker, 'Podaj kod do konta, aby odebrać nagrodę');
    const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
    await next.click();
    await dialog.getByLabel('Osoba, którą znam', { exact: true }).check();
    await next.click();
    await untouchedQuestion(dialog, 'Czego chce nadawca i czy pogania?');
    const code = dialog.getByLabel('Podania kodu do konta', { exact: true });
    await expect(code).not.toBeChecked();
    await expect(dialog.locator('.question-option').filter({ hasText: 'Podania kodu do konta' })).toContainText('Podpowiedź z wiadomości');
    await dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true }).check();
    await next.click();
    await expect(dialog).toContainText('W wiadomości jest prośba o kod. Czy chcesz zmienić odpowiedź?');
    const correct = dialog.getByRole('button', { name: 'Popraw odpowiedź', exact: true });
    const retain = dialog.getByRole('button', { name: 'Zostaw moją odpowiedź', exact: true });
    await expect(correct).toBeVisible();
    await expect(retain).toBeVisible();
    await expect(dialog.getByRole('group', { name: 'Czego chce nadawca i czy pogania?', exact: true })).toBeVisible();
    await expect(code).not.toBeChecked();
    await expect(dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true })).toBeChecked();
    if (branch === 'retain') {
      await retain.click();
    } else {
      await correct.click();
      await code.check();
      await expect(dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true })).not.toBeChecked();
      await next.click();
    }
    await untouchedQuestion(dialog, 'Jak możesz sprawdzić poza tą wiadomością?');
    await dialog.getByLabel('Przez znaną mi aplikację, stronę lub kontakt', { exact: true }).check();
    await next.click();
    await expect(dialog).toContainText('Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.');
    const conflict = 'Twoja odpowiedź różni się od prośby rozpoznanej w wiadomości. Nie mamy pewności, jak ją rozumieć; ostrzeżenie o haśle lub kodzie pozostaje.';
    if (branch === 'retain') await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(conflict);
    else {
      await expect(dialog).not.toContainText(conflict);
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Ta wiadomość wymaga ostrożności. Sprawdź, co zwraca uwagę, zanim zrobisz kolejny krok.');
    }
    await expect(dialog.locator('.result-step')).toHaveCount(1);
    await expect(dialog.locator('.result-step')).toContainText('Zatrzymaj się i nie podawaj hasła ani kodu');
    await expect(dialog.locator('.result-step')).toContainText('Nie odpowiadaj hasłem ani kodem. Poproś zaufaną osobę dorosłą o pomoc lub skontaktuj się z pomocą przez znaną Ci oficjalną aplikację albo stronę, otwartą bez linku z wiadomości.');
    await expect(dialog.getByRole('link')).toHaveCount(0);
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);

    if (branch === 'retain') {
      // A retained answer survives Back, but changing that answer needs a fresh acknowledgment.
      await dialog.getByRole('button', { name: 'Popraw odpowiedzi', exact: true }).click();
      await next.click();
      await expect(dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true })).toBeChecked();
      await next.click();
      await expect(dialog.getByRole('group', { name: 'Jak możesz sprawdzić poza tą wiadomością?', exact: true })).toBeVisible();
      await dialog.getByRole('button', { name: 'Wróć', exact: true }).click();
      await code.check();
      await dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true }).check();
      await next.click();
      await expect(retain).toBeVisible();
      await retain.click();
      await next.click();
      await expect(dialog).toContainText(conflict);
      await expect(dialog).toContainText('Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.');
    }
    await assertOnlyLocal(netlog);
  });
}
