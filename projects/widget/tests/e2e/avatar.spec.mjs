import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
import { STRINGS } from '../../src/ui/strings.pl.js';
const url = 'http://127.0.0.1:4173/chat-like.html';
const avatar = p => p.getByRole('button', {name:'Scamerinio',exact:true});
const formText = p => p.getByRole('textbox', {name:'Wiadomość',exact:true});
const formButton = (p, name) => p.getByRole('button', {name,exact:true});
async function checkForm(page) {
  await expect(avatar(page)).toBeVisible();
  await expect(page.locator('.hide')).toBeVisible();
  await expect(page.locator('bezpieczna-aura-widget')).toBeVisible();
  await expect(formText(page)).toBeVisible(); await expect(formText(page)).toBeEditable();
  await expect(page.locator('.avatar-wrap')).toHaveJSProperty('inert', false);
  const r = await page.getByRole('dialog').boundingBox(), v = page.viewportSize();
  expect(r.x).toBeGreaterThanOrEqual(8); expect(r.y).toBeGreaterThanOrEqual(8);
  expect(r.x+r.width).toBeLessThanOrEqual(v.width-8); expect(r.y+r.height).toBeLessThanOrEqual(v.height-8);
}
for (const close of ['button', 'Escape']) test(`form preserves anchor and draft after ${close} and resize`, async ({page,netlog}) => {
  await page.goto(url); await gesture(page,-120,-100);
  const before = await avatar(page).boundingBox();
  await avatar(page).click(); await expect(avatar(page)).toBeVisible();
  await formButton(page,'Sprawdź wiadomość').click(); await checkForm(page);
  const anchor = await page.locator('.avatar').evaluate(el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  expect(anchor).toEqual(before);
  await formText(page).fill('Fikcyjny szkic do retestu');
  await formButton(page,'Dalej').click(); await checkForm(page);
  const panel = await page.getByRole('dialog').boundingBox();
  expect(panel.x+panel.width).toBeCloseTo(before.x+before.width);
  // The visible drag handle stays available in the document's tab order.
  await formText(page).focus();
  let focusedAvatar = false;
  for (let i=0;i<12;i++) {
    await page.keyboard.press('Tab');
    focusedAvatar ||= await avatar(page).evaluate(el => el.getRootNode().activeElement === el);
  }
  expect(focusedAvatar).toBe(true);
  await page.setViewportSize({width:640,height:480}); await checkForm(page);
  await formText(page).fill('Szkic po zmianie rozmiaru');
  const resized = await page.locator('.avatar').evaluate(el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  if (close === 'button') await formButton(page,'Zamknij okno').click();
  else { await formText(page).focus(); await page.keyboard.press('Escape'); }
  await expect(avatar(page)).toBeVisible(); await expect(page.getByRole('dialog')).toBeHidden();
  expect(await avatar(page).boundingBox()).toEqual(resized);
  await expect(page.locator('.avatar-wrap')).toHaveJSProperty('inert',false);
  await avatar(page).click(); await checkForm(page); await expect(formText(page)).toHaveValue('Szkic po zmianie rozmiaru');
  await formButton(page,'Zamknij okno').click(); await formButton(page,'Schowaj pomocnika').click();
  await expect(page.locator('bezpieczna-aura-widget')).toBeHidden(); await assertOnlyLocal(netlog);
});
test('selected preview keeps avatar visible through safety', async ({page,netlog}) => {
  await page.goto(url); await page.locator('#msg').selectText(); await avatar(page).click(); await checkForm(page);
  await formButton(page,'Zatwierdzam').click(); await expect(page.getByText(STRINGS.safetyNotice,{exact:true})).toBeVisible();
  await expect(avatar(page)).toBeVisible(); await expect(page.locator('.hide')).toBeVisible();
  await expect(page.locator('.avatar-wrap')).toHaveJSProperty('inert',false); await assertOnlyLocal(netlog);
});
async function gesture(page, dx, dy) {
  const r = await avatar(page).boundingBox(); const x = r.x + 32, y = r.y + 32;
  await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x+dx,y+dy,{steps:10}); await page.mouse.up();
}
async function openView(page, view) {
  await page.goto(url);
  await avatar(page).click();
  if (view === 'howto') await formButton(page, 'Jak to działa').click();
  if (['paste', 'preview', 'safety', 'question', 'result'].includes(view)) {
    await formButton(page, 'Sprawdź wiadomość').click();
    await formText(page).fill('Fikcyjny szkic do przeciągania');
    await page.getByRole('textbox', { name: 'Link (jeśli jest)', exact: true }).fill('https://example.test/wiadomosc');
    if (view !== 'paste') await formButton(page, 'Dalej').click();
    if (['safety', 'question', 'result'].includes(view)) {
      await formButton(page, STRINGS.approve).click();
      await expect(page.getByText(STRINGS.safetyNotice, { exact: true })).toBeVisible();
    }
    if (['question', 'result'].includes(view)) {
      await formButton(page, STRINGS.next).click();
      await page.getByLabel('Osoba, którą znam', { exact: true }).check();
      await formButton(page, STRINGS.next).click();
      await page.getByLabel('Podania kodu do konta', { exact: true }).check();
      if (view === 'result') {
        await formButton(page, STRINGS.next).click();
        await page.getByLabel('Przez znaną mi aplikację, stronę lub kontakt', { exact: true }).check();
        await formButton(page, STRINGS.next).click();
        await expect(formButton(page, STRINGS.openLogin)).toBeVisible();
      }
    }
  }
}
async function expectBounded(page) {
  const v = page.viewportSize();
  for (const target of [avatar(page), page.getByRole('dialog')]) {
    const r = await target.boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(8); expect(r.y).toBeGreaterThanOrEqual(8);
    expect(r.x + r.width).toBeLessThanOrEqual(v.width - 8);
    expect(r.y + r.height).toBeLessThanOrEqual(v.height - 8);
  }
  // A clamped panel must not cover the handle needed to move it again.
  const r = await avatar(page).boundingBox();
  expect(await avatar(page).evaluate((el, point) => el.getRootNode().elementFromPoint(point.x, point.y) === el,
    { x: r.x + r.width / 2, y: r.y + r.height / 2 })).toBe(true);
}
for (const view of ['menu', 'howto', 'paste', 'preview', 'safety', 'question', 'result']) {
  test(`open ${view} follows avatar throughout drag without rebuilding or submitting`, async ({page, serviceWorker, netlog}) => {
    await page.setViewportSize({ width: 1400, height: view === 'result' ? 1400 : 1000 });
    await openView(page, view);
    if (view === 'safety') {
      await expect(page.getByText(STRINGS.safetyNotice, { exact: true })).toBeVisible();
      expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
    }
    const checking = ['question', 'result'].includes(view);
    if (view === 'question') {
      await expect(page.getByRole('group', { name: STRINGS.checkQuestions[1].title, exact: true })).toBeVisible();
      await expect(page.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
    }
    if (view === 'result') {
      await expect(page.locator('.result-section')).toHaveCount(3);
      await expect(page.getByText(STRINGS.checkSignals.credential_code, { exact: true })).toBeVisible();
    }
    const editing = ['paste', 'preview'].includes(view);
    if (editing) {
      await formText(page).focus();
      await formText(page).evaluate(el => el.setSelectionRange(4, 10));
    }
    if (checking) {
      await page.locator('#msg2').selectText();
      await (view === 'question' ? page.getByLabel('Podania kodu do konta', { exact: true }) : formButton(page, STRINGS.openLogin)).focus();
    }
    const snapshot = await page.locator('bezpieczna-aura-widget').evaluate(host => {
      const root = host.shadowRoot;
      host.__dragNodes = [...root.querySelectorAll('.panel input, .panel textarea, .panel button')];
      host.__dragFocus = root.activeElement;
      return host.__dragNodes.map(el => ({ value: el.value, checked: el.checked, start: el.selectionStart, end: el.selectionEnd }));
    });
    const messages = await serviceWorker.evaluate(() => self.__aura.messages.length);
    const panelBefore = await page.getByRole('dialog').boundingBox(), sharkBefore = await avatar(page).boundingBox();
    await page.mouse.move(sharkBefore.x + 32, sharkBefore.y + 32); await page.mouse.down();
    for (const [dx, dy] of [[-30, -20], [-60, -40], [-90, -60]]) {
      await page.mouse.move(sharkBefore.x + 32 + dx, sharkBefore.y + 32 + dy, { steps: 3 });
      const shark = await avatar(page).boundingBox(), panel = await page.getByRole('dialog').boundingBox();
      expect(shark.x - sharkBefore.x).toBeCloseTo(dx); expect(shark.y - sharkBefore.y).toBeCloseTo(dy);
      expect(panel.x - panelBefore.x).toBeCloseTo(dx); expect(panel.y - panelBefore.y).toBeCloseTo(dy);
      if (checking) {
        expect(await page.locator('bezpieczna-aura-widget').evaluate(host => {
          const nodes = [...host.shadowRoot.querySelectorAll('.panel input, .panel textarea, .panel button')];
          return nodes.every((node, i) => node === host.__dragNodes[i]) && host.shadowRoot.activeElement === host.__dragFocus;
        })).toBe(true);
        await expect(formButton(page, STRINGS.checkNewSelection)).toHaveCount(0);
      }
    }
    await page.mouse.up();
    expect(await page.locator('bezpieczna-aura-widget').evaluate(host => {
      const nodes = [...host.shadowRoot.querySelectorAll('.panel input, .panel textarea, .panel button')];
      return nodes.length === host.__dragNodes.length && nodes.every((el, i) => el === host.__dragNodes[i]);
    })).toBe(true);
    expect(await page.locator('bezpieczna-aura-widget').evaluate(host =>
      host.__dragNodes.map(el => ({ value: el.value, checked: el.checked, start: el.selectionStart, end: el.selectionEnd })))).toEqual(snapshot);
    if (editing || checking) expect(await page.locator('bezpieczna-aura-widget').evaluate(host => host.shadowRoot.activeElement === host.__dragFocus)).toBe(true);
    expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(messages);
    await expectBounded(page); await assertOnlyLocal(netlog);
  });
}

for (const view of ['question', 'result']) test(`open ${view} stays reachable at edges and after resize without recapturing or submitting`, async ({ page, serviceWorker, netlog }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await openView(page, view);
  if (view === 'question') await expect(page.getByRole('group', { name: STRINGS.checkQuestions[1].title, exact: true })).toBeVisible();
  else await expect(page.locator('.result-section')).toHaveCount(3);
  const oldText = await page.getByRole('dialog').textContent();
  await page.locator('#msg2').selectText();
  for (const [dx, dy] of [[-2000, -2000], [2000, -2000], [0, 2000], [-2000, 0]]) {
    await gesture(page, dx, dy); await expectBounded(page);
    expect(await page.getByRole('dialog').textContent()).toBe(oldText);
    await expect(formButton(page, STRINGS.checkNewSelection)).toHaveCount(0);
    if (view === 'question') await expect(page.getByLabel('Podania kodu do konta', { exact: true })).toBeChecked();
  }
  await page.setViewportSize({ width: 280, height: 640 });
  await expect.poll(async () => { const r = await avatar(page).boundingBox(); return r.x + r.width; }).toBeLessThanOrEqual(272);
  await expectBounded(page);
  expect(await page.getByRole('dialog').textContent()).toBe(oldText);
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const control = formButton(page, view === 'question' ? STRINGS.next : STRINGS.editCheckContent);
  await control.scrollIntoViewIfNeeded(); await expect(control).toBeInViewport(); await expect(control).toBeEnabled();
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1);
  await assertOnlyLocal(netlog);
});
test('open preview stays reachable at edges and after resize without recapturing page selection', async ({page, serviceWorker, netlog}) => {
  await openView(page, 'preview');
  await page.locator('#msg2').selectText();
  for (const [dx, dy] of [[-2000, -2000], [2000, -2000], [0, 2000], [-2000, 0]]) {
    await gesture(page, dx, dy); await expectBounded(page);
    await expect(formText(page)).toHaveValue('Fikcyjny szkic do przeciągania');
    await expect(formButton(page, 'Wstaw nowe zaznaczenie')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 640, height: 480 });
  await expect.poll(async () => { const r = await avatar(page).boundingBox(); return r.y + r.height; }).toBeLessThanOrEqual(472);
  await expectBounded(page);
  await expect(formText(page)).toHaveValue('Fikcyjny szkic do przeciągania');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0);
  await assertOnlyLocal(netlog);
});
test('pointer cancellation ends drag and allows another gesture with open paste', async ({page, netlog}) => {
  await openView(page, 'paste');
  const r = await avatar(page).boundingBox();
  await page.mouse.move(r.x + 32, r.y + 32); await page.mouse.down();
  await page.mouse.move(r.x - 30, r.y - 30);
  await avatar(page).dispatchEvent('pointercancel', { pointerId: 1 });
  const before = await avatar(page).boundingBox();
  await page.mouse.move(r.x - 50, r.y - 50); await page.mouse.up();
  expect(await avatar(page).boundingBox()).toEqual(before);
  await expect(avatar(page)).not.toHaveClass(/dragging/);
  await gesture(page, -30, -20);
  await expect(formText(page)).toHaveValue('Fikcyjny szkic do przeciągania');
  await expectBounded(page); await assertOnlyLocal(netlog);
});
test('avatar mounts once on each ordinary page', async ({page,netlog}) => {
  await page.goto(url); await expect(avatar(page)).toBeVisible(); await expect(page.locator('bezpieczna-aura-widget')).toHaveCount(1);
  await page.goto('http://127.0.0.1:4173/other.html'); await expect(avatar(page)).toBeVisible(); await expect(page.locator('bezpieczna-aura-widget')).toHaveCount(1); await assertOnlyLocal(netlog);
});
test('drag moves without opening a panel', async ({page,netlog}) => {
  await page.goto(url); const before = await avatar(page).boundingBox(); await gesture(page,-120,-100);
  const after = await avatar(page).boundingBox(); expect(after.x).toBeCloseTo(before.x-120); expect(after.y).toBeCloseTo(before.y-100);
  await expect(page.getByRole('dialog')).toBeHidden(); await assertOnlyLocal(netlog);
});
test('drag clamps at viewport edges and a five pixel gesture clicks', async ({page,netlog}) => {
  await page.goto(url); const r = await avatar(page).boundingBox(); await gesture(page, -r.x-20, -r.y-20);
  const moved = await avatar(page).boundingBox(); expect(moved.x).toBe(8); expect(moved.y).toBe(8);
  await page.locator('#msg').selectText(); await gesture(page,3,4); await expect(page.getByRole('dialog')).toBeVisible(); await assertOnlyLocal(netlog);
});
test('hide, reload and acknowledged toolbar restore', async ({page,serviceWorker,netlog}) => {
  await page.goto(url); const hide = page.getByRole('button',{name:'Schowaj pomocnika',exact:true}); await hide.click(); await expect(avatar(page)).toBeHidden();
  await page.reload(); await expect(avatar(page)).toBeVisible(); await hide.click();
  const results = await serviceWorker.evaluate(async () => { const out=[]; for (const t of await chrome.tabs.query({})) out.push(await self.__aura.onActionClicked(t)); return out; });
  expect(results.filter(r=>r.ok && r.via==='message')).toHaveLength(1); await expect(avatar(page)).toBeVisible(); await assertOnlyLocal(netlog);
});
test('window and text stay on their tab', async ({page,context,netlog}) => {
  await page.goto(url); const text = await page.locator('#msg').textContent(); await page.locator('#msg').selectText(); await avatar(page).click();
  const other = await context.newPage(); await other.goto('http://127.0.0.1:4173/other.html'); await expect(avatar(other)).toBeVisible(); await expect(other.getByRole('dialog')).toBeHidden();
  await page.bringToFront(); await expect(page.getByRole('textbox',{name:'Wiadomość',exact:true})).toHaveValue(text); await assertOnlyLocal(netlog);
});
