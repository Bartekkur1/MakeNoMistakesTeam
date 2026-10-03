import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
const url = 'http://127.0.0.1:4173/chat-like.html';
const avatar = p => p.getByRole('button', {name:'Scamerinio',exact:true});
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
