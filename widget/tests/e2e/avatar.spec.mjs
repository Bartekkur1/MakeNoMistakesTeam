import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
const url = 'http://127.0.0.1:4173/chat-like.html';
const avatar = p => p.getByRole('button', {name:'Scamerinio',exact:true});
const formText = p => p.getByRole('textbox', {name:'Wiadomość',exact:true});
const formButton = (p, name) => p.getByRole('button', {name,exact:true});
async function checkForm(page) {
  await expect(page.locator('.avatar')).toBeHidden();
  await expect(page.locator('.hide')).toBeHidden();
  await expect(page.locator('bezpieczna-aura-widget')).toBeVisible();
  await expect(formText(page)).toBeVisible(); await expect(formText(page)).toBeEditable();
  await expect(page.locator('.avatar-wrap')).toHaveJSProperty('inert', true);
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
  // Traverse the document's tab order: neither hidden avatar button may receive focus.
  await formText(page).focus();
  for (let i=0;i<12;i++) {
    await page.keyboard.press('Tab');
    expect(await page.locator('bezpieczna-aura-widget').evaluate(host => host.shadowRoot.activeElement?.closest('.avatar-wrap') !== null && Boolean(host.shadowRoot.activeElement))).toBe(false);
  }
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
test('selected preview hides avatar until confirmation', async ({page,netlog}) => {
  await page.goto(url); await page.locator('#msg').selectText(); await avatar(page).click(); await checkForm(page);
  await formButton(page,'Zatwierdzam').click(); await expect(page.getByRole('heading',{name:'Gotowe!',exact:true})).toBeVisible();
  await expect(avatar(page)).toBeVisible(); await expect(page.locator('.hide')).toBeVisible();
  await expect(page.locator('.avatar-wrap')).toHaveJSProperty('inert',false); await assertOnlyLocal(netlog);
});
async function gesture(page, dx, dy) {
  const r = await avatar(page).boundingBox(); const x = r.x + 32, y = r.y + 32;
  await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x+dx,y+dy,{steps:10}); await page.mouse.up();
}
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
