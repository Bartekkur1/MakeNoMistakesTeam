import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
const fields = 'http://127.0.0.1:4173/fields.html';
const avatar = page => page.getByRole('button', { name: 'Scamerinio', exact: true });
const preview = page => page.getByRole('textbox', { name: 'Wiadomość', exact: true });
for (const [id, text, kind] of [
  ['notes', 'Darmowe Nitro: https://nitro-gift.example/x', 'textarea'],
  ['field', 'ABC-123', 'input'],
  ['editable', 'Hej, wejdź na nitro-free.example i zaloguj się', 'contenteditable'],
]) test(`selection from ${kind} reaches preview`, async ({ page, serviceWorker, netlog }) => {
  await page.goto(fields);
  if (kind === 'contenteditable') await page.locator('#editable').selectText();
  else await page.locator('#' + id).evaluate((el, selected) => { el.focus(); const start = el.value.indexOf(selected); el.setSelectionRange(start, start + selected.length); }, text);
  await avatar(page).click();
  await expect(preview(page)).toHaveValue(text);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  await assertOnlyLocal(netlog, { mustInclude: fields });
});
for (const kind of ['password', 'iframe', 'foreign shadow']) test(`${kind} is never captured`, async ({ page, serviceWorker, netlog }) => {
  await page.goto(fields);
  if (kind === 'iframe') await page.frameLocator('#ramka').locator('#msg-in-frame').selectText();
  else await page.locator(kind === 'password' ? '#secret' : '#obcy-input').evaluate(el => { el.focus(); el.select(); });
  await avatar(page).click();
  await expect(preview(page)).toHaveCount(0);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  await assertOnlyLocal(netlog, { mustInclude: fields });
});
test('known capture-phase focus stealing limit', async ({ page, netlog }) => {
  test.fail(true, 'Shadow containment covers bubble-phase only; verified Discord tracer decides architecture. Remove only if panel moves to extension-page iframe.');
  const url = 'http://127.0.0.1:4173/capture-autofocus.html';
  await page.goto(url);
  await page.locator('#msg').selectText(); await avatar(page).click();
  await preview(page).click(); await preview(page).pressSequentially('test');
  await assertOnlyLocal(netlog, { mustInclude: url });
  await expect(page.locator('#composer')).toHaveValue('');
  await expect(preview(page)).toHaveValue(/test$/);
});
