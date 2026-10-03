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

const shark = page => page.getByRole('button', { name: 'Scamerinio', exact: true });
const clearSelection = page => page.evaluate(() => getSelection().removeAllRanges());
async function reachStep(dialog, step) {
  if (step === 'safety') return;
  const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
  await next.click();
  for (const [id, label] of [['sender', 'Osoba, którą znam'], ['request', 'Podania kodu do konta'], ['verify', 'Przez znaną mi aplikację, stronę lub kontakt']]) {
    await dialog.getByLabel(label, { exact: true }).check();
    if (step === id) return;
    await next.click();
  }
}

for (const step of ['safety', 'sender', 'request', 'verify', 'result']) test(`close and toolbar hide restore the same ${step} check in the real extension`, async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker); await reachStep(dialog, step);
  const before = await dialog.textContent();
  const selected = await dialog.locator('input:checked').evaluateAll(nodes => nodes.map(node => node.value));
  await dialog.getByRole('button', { name: 'Zamknij okno', exact: true }).click();
  await clearSelection(page); await shark(page).click();
  expect(await dialog.textContent()).toBe(before);
  expect(await dialog.locator('input:checked').evaluateAll(nodes => nodes.map(node => node.value))).toEqual(selected);
  await page.getByRole('button', { name: 'Schowaj pomocnika', exact: true }).click();
  await expect(shark(page)).toBeHidden();
  // Tab URLs are withheld without the tabs permission; use the established ID-based toolbar harness.
  const restored = await serviceWorker.evaluate(async () => {
    const results = [];
    for (const tab of await chrome.tabs.query({})) results.push(await self.__aura.onActionClicked(tab));
    return results;
  });
  expect(restored.filter(result => result.ok && result.via === 'message')).toHaveLength(1);
  await expect(shark(page)).toBeVisible(); await expect(dialog).toBeHidden(); await shark(page).click();
  expect(await dialog.textContent()).toBe(before);
  expect(await dialog.locator('input:checked').evaluateAll(nodes => nodes.map(node => node.value))).toEqual(selected);
  await expect(dialog.getByRole('button', { name: 'Sprawdź nowe zaznaczenie', exact: true })).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});

test('tab switch and same-document navigation preserve Q2 choices without transferring the panel', async ({ page, context, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker); await reachStep(dialog, 'request');
  await dialog.getByLabel('Zapłaty lub przelewu', { exact: true }).check();
  const other = await context.newPage(); await other.goto('http://127.0.0.1:4173/other.html');
  await other.bringToFront(); await expect(shark(other)).toBeVisible(); await expect(other.getByRole('dialog')).toBeHidden();
  await page.bringToFront();
  await expect(dialog.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
  await expect(dialog.getByLabel('Zapłaty lub przelewu', { exact: true })).toBeChecked();
  await page.evaluate(() => history.pushState({}, '', '/chat-like.html?kanal=2'));
  await dialog.getByRole('button', { name: 'Zamknij okno', exact: true }).click();
  await clearSelection(page); await shark(page).click();
  await expect(dialog.getByRole('group', { name: 'Czego chce nadawca i czy pogania?', exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
  await expect(dialog.getByLabel('Zapłaty lub przelewu', { exact: true })).toBeChecked();
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});

test('captured replacement resumes Q2 then cancels without loss and commits only on approval', async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker); await reachStep(dialog, 'request');
  const replacement = (await page.locator('#msg').textContent()).trim();
  await dialog.getByRole('button', { name: 'Zamknij okno', exact: true }).click();
  await page.locator('#msg').selectText(); await shark(page).click();
  await expect(dialog.getByRole('group', { name: 'Czego chce nadawca i czy pogania?', exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
  const replace = dialog.getByRole('button', { name: 'Sprawdź nowe zaznaczenie', exact: true });
  await expect(replace).toBeVisible(); await replace.click();
  await expect(dialog.getByRole('textbox', { name: 'Wiadomość', exact: true })).toHaveValue(replacement);
  await expect(dialog.getByRole('textbox', { name: 'Link (jeśli jest)', exact: true })).toHaveValue('https://discord-nitro-free.example/gift');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await dialog.getByRole('button', { name: 'Wróć do sprawdzania', exact: true }).click();
  await expect(dialog.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
  await expect(replace).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Edytuj wiadomość', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Wiadomość', exact: true })).toHaveValue(honest);
  await dialog.getByRole('button', { name: 'Wróć do sprawdzania', exact: true }).click();
  await page.locator('#msg').selectText(); await shark(page).click(); await replace.click();
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await dialog.getByRole('button', { name: 'Zatwierdzam', exact: true }).click();
  await expect(dialog).toContainText(safety);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(2);
  expect(await serviceWorker.evaluate(() => self.__aura.cases)).toMatchObject([
    { content: honest, origin: 'paste' }, { content: replacement, link: 'https://discord-nitro-free.example/gift', origin: 'selection' },
  ]);
  await dialog.getByRole('button', { name: 'Dalej', exact: true }).click();
  for (const title of ['Kto wysłał wiadomość?', 'Czego chce nadawca i czy pogania?', 'Jak możesz sprawdzić poza tą wiadomością?']) {
    await untouchedQuestion(dialog, title);
    await dialog.getByLabel('Nie wiem', { exact: true }).check(); await dialog.getByRole('button', { name: 'Dalej', exact: true }).click();
  }
  await expect(dialog).not.toContainText('Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(2);
  await assertOnlyLocal(netlog);
});

test('reload and document navigation clear approved answers and an unfinished edit', async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker); await reachStep(dialog, 'request');
  await page.reload(); await clearSelection(page); await shark(page).click();
  await expect(page.locator('.menu')).toBeVisible(); await expect(dialog.getByRole('group')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Sprawdź wiadomość', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Wiadomość', exact: true }).fill(honest);
  await dialog.getByRole('button', { name: 'Dalej', exact: true }).click();
  await dialog.getByRole('button', { name: 'Zatwierdzam', exact: true }).click();
  await expect(dialog).toContainText(safety); await reachStep(dialog, 'result');
  await dialog.getByRole('button', { name: 'Edytuj wiadomość', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Wiadomość', exact: true }).fill('Unfinished private candidate');
  await page.goto('http://127.0.0.1:4173/other.html'); await clearSelection(page); await shark(page).click();
  await expect(page.locator('.menu')).toBeVisible(); await expect(page.getByRole('textbox')).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(2);
  await assertOnlyLocal(netlog);
});

for (const change of ['text', 'link-only']) {
  test(`result correction and ${change} reapproval preserve cancellation and reset the approved session`, async ({ page, serviceWorker, netlog }) => {
    const dialog = await approve(page, serviceWorker);
    const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
    await next.click();
    await dialog.getByLabel('Osoba, którą znam', { exact: true }).check();
    await next.click();
    await dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true }).check();
    await next.click();
    await dialog.getByLabel('Przez znaną mi aplikację, stronę lub kontakt', { exact: true }).check();
    await next.click();
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(summary);

    // Correction changes the output but keeps the other deliberate choices.
    await dialog.getByRole('button', { name: 'Popraw odpowiedzi', exact: true }).click();
    await expect(dialog.getByLabel('Osoba, którą znam', { exact: true })).toBeChecked();
    await next.click();
    await expect(dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true })).toBeChecked();
    await dialog.getByLabel('Podania kodu do konta', { exact: true }).check();
    await expect(dialog.getByLabel('Zwykła wiadomość, bez takich próśb', { exact: true })).not.toBeChecked();
    await next.click();
    await expect(dialog.getByLabel('Przez znaną mi aplikację, stronę lub kontakt', { exact: true })).toBeChecked();
    await dialog.getByRole('button', { name: 'Wróć', exact: true }).click();
    await expect(dialog.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
    await next.click();
    await next.click();
    await expect(dialog).not.toContainText(summary);
    await expect(dialog).toContainText('Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.');
    await expect(dialog.locator('.result-step p').first()).toHaveText('Zatrzymaj się i nie podawaj hasła ani kodu');
    const oldResult = await dialog.locator('h2, .result-section').allTextContents();
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);

    const edit = dialog.getByRole('button', { name: 'Edytuj wiadomość', exact: true });
    await expect(edit).toBeVisible();
    await edit.click();
    const message = dialog.getByRole('textbox', { name: 'Wiadomość', exact: true });
    const link = dialog.getByRole('textbox', { name: 'Link (jeśli jest)', exact: true });
    await expect(message).toHaveValue(honest);
    await expect(link).toHaveValue('');
    await message.fill('Anulowany tekst: podaj hasło do konta');
    await link.fill('https://anulowany.example/');
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
    await dialog.getByRole('button', { name: 'Wróć do sprawdzania', exact: true }).click();
    expect(await dialog.locator('h2, .result-section').allTextContents()).toEqual(oldResult);
    expect(await serviceWorker.evaluate(() => self.__aura.cases)).toMatchObject([{ content: honest, link: '' }]);

    await edit.click();
    await expect(message).toHaveValue(honest);
    await expect(link).toHaveValue('');
    const newText = change === 'text' ? 'Zobacz to' : honest;
    const newLink = change === 'link-only' ? 'https://nowy.example/wiadomosc' : '';
    if (change === 'text') await message.fill(newText);
    else await link.fill(newLink);
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
    await dialog.getByRole('button', { name: 'Zatwierdzam', exact: true }).click();
    await expect(dialog).toContainText(safety);
    await expect(dialog.locator('.result-section')).toHaveCount(0);
    await expect(edit).toBeVisible();
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(2);
    expect(await serviceWorker.evaluate(() => self.__aura.cases)).toMatchObject([
      { content: honest, link: '' }, { content: newText, link: newLink, origin: 'paste' },
    ]);
    await next.click();
    for (const title of ['Kto wysłał wiadomość?', 'Czego chce nadawca i czy pogania?', 'Jak możesz sprawdzić poza tą wiadomością?']) {
      await untouchedQuestion(dialog, title);
      await expect(edit).toBeVisible();
      if (title === 'Czego chce nadawca i czy pogania?') await expect(dialog.locator('.hint-badge')).toHaveCount(0);
      if (title === 'Jak możesz sprawdzić poza tą wiadomością?') {
        await expect(dialog.locator('.hint-badge')).toHaveCount(0);
      }
      await dialog.getByLabel('Nie wiem', { exact: true }).check();
      await next.click();
    }
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Brakuje nam informacji. Możesz spokojnie sprawdzić wiadomość przez znany Ci kontakt.');
    await expect(dialog).not.toContainText('Prośba o kod do konta to sygnał ostrzegawczy. Nie podawaj go.');
    await expect(dialog).toContainText('Nie wiemy jeszcze, kto naprawdę wysłał wiadomość.');
    await expect(dialog).toContainText('Nie wiemy jeszcze, czego nadawca oczekuje.');
    await expect(dialog.locator('.result-step p').first()).toHaveText('Sprawdź przez znany Ci kanał');
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(2);
    await assertOnlyLocal(netlog);
  });
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
  await expect(dialog.getByRole('region', { name: 'Co zwraca uwagę', exact: true })).toContainText('Nie widzę typowych sygnałów oszustwa w wiadomości ani w Twoich odpowiedziach.');
  await expect(dialog.getByRole('region', { name: 'Czego jeszcze nie wiemy', exact: true })).toContainText('Nie wskazano dodatkowych brakujących informacji. To nie potwierdza tożsamości nadawcy ani bezpieczeństwa wiadomości.');
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

for (const scenario of [
  {
    name: 'prize with a link', text: 'Odbierz darmową nagrodę: https://nagroda.example/prezent',
    choices: [['Ktoś podaje się za firmę lub organizację'], ['Odebrania darmowej nagrody'], ['Tylko przez link z tej wiadomości']],
    reasons: ['Wiadomość zachęca do odebrania darmowej nagrody przez podany link. Sprawdź tę ofertę poza wiadomością.'],
    missing: ['Nie wiemy jeszcze, jak sprawdzić wiadomość niezależnie.'],
    action: 'Sprawdź nagrodę poza wiadomością',
    explanation: 'Otwórz znaną Ci oficjalną aplikację lub stronę samodzielnie, bez podanego linku. Sprawdź, czy taka nagroda jest tam opisana, lub poproś zaufaną osobę dorosłą o pomoc.',
  },
  {
    name: 'payment with pressure', text: 'Zapłać natychmiast, inaczej stracisz konto.',
    choices: [['Nie znam nadawcy'], ['Zapłaty lub przelewu', 'Szybkiego działania, bez czasu na sprawdzenie'], ['Nie mam innego sposobu']],
    reasons: ['Prośba o zapłatę wymaga sprawdzenia poza wiadomością. Pośpiech lub groźba straty utrudnia spokojną decyzję.', 'Pośpiech utrudnia sprawdzenie wiadomości. Możesz się zatrzymać.'],
    missing: ['Nie wiemy jeszcze, kto naprawdę wysłał wiadomość.', 'Nie wiemy jeszcze, jak sprawdzić wiadomość niezależnie.'],
    action: 'Sprawdź prośbę, zanim zapłacisz',
    explanation: 'Skontaktuj się z nadawcą przez wcześniej znany kontakt. Możesz poprosić zaufaną osobę o pomoc, zanim przekażesz pieniądze.',
  },
  {
    name: 'ambiguous message', text: 'Zobacz to', choices: [['Nie wiem'], ['Nie wiem'], ['Nie wiem']],
    reasons: ['Nie widzę typowych sygnałów oszustwa w wiadomości ani w Twoich odpowiedziach.'],
    missing: ['Nie wiemy jeszcze, kto naprawdę wysłał wiadomość.', 'Nie wiemy jeszcze, czego nadawca oczekuje.', 'Nie wiemy jeszcze, czy nadawca pogania i ile masz czasu na sprawdzenie.', 'Nie wiemy jeszcze, jak sprawdzić wiadomość niezależnie.'],
    action: 'Sprawdź przez znany Ci kanał',
    explanation: 'Otwórz znaną Ci oficjalną aplikację lub stronę bezpośrednio albo skontaktuj się z nadawcą przez wcześniej znany kontakt.',
  },
]) test(`D-14 ${scenario.name} renders reasons, missing facts and one explained action locally`, async ({ page, serviceWorker, netlog }) => {
  const dialog = await approve(page, serviceWorker, scenario.text);
  const next = dialog.getByRole('button', { name: 'Dalej', exact: true });
  await next.click();
  for (const [index, title] of ['Kto wysłał wiadomość?', 'Czego chce nadawca i czy pogania?', 'Jak możesz sprawdzić poza tą wiadomością?'].entries()) {
    await untouchedQuestion(dialog, title);
    for (const label of scenario.choices[index]) await dialog.getByLabel(label, { exact: true }).check();
    await next.click();
  }
  await expect(dialog.locator('.result-section')).toHaveCount(3);
  const signals = dialog.getByRole('region', { name: 'Co zwraca uwagę', exact: true });
  const unknowns = dialog.getByRole('region', { name: 'Czego jeszcze nie wiemy', exact: true });
  for (const reason of scenario.reasons) await expect(signals).toContainText(reason);
  for (const fact of scenario.missing) await expect(unknowns).toContainText(fact);
  const action = dialog.getByRole('region', { name: 'Co możesz teraz zrobić', exact: true });
  await expect(dialog.locator('.result-step')).toHaveCount(1);
  await expect(action.locator('p')).toHaveCount(2);
  await expect(action.locator('p').first()).toHaveText(scenario.action);
  await expect(action.locator('p').last()).toHaveText(scenario.explanation);
  await expect(dialog).not.toContainText(/undefined|credential_|prize_link|payment_pressure|official_channel|_how|wiadomość jest bezpieczna/i);
  await expect(dialog.getByRole('link')).toHaveCount(0);
  if (scenario.name === 'ambiguous message') await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Brakuje nam informacji. Możesz spokojnie sprawdzić wiadomość przez znany Ci kontakt.');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});
