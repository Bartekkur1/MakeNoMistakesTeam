import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
const url='http://127.0.0.1:4173/chat-like.html',other='http://127.0.0.1:4173/other.html';
const avatar=p=>p.getByRole('button',{name:'Scamerinio',exact:true});
const text=p=>p.getByRole('textbox',{name:'Wiadomość',exact:true});
const button=(p,name)=>p.getByRole('button',{name,exact:true});
const clear=p=>p.evaluate(()=>getSelection().removeAllRanges());
async function draft(page,edit=true){await page.goto(url);await page.locator('#msg').selectText();await avatar(page).click();if(edit)await text(page).fill('Darmowe Nitro! Kliknij link');}
test('draft survives close and hide on same tab',async({page,serviceWorker,netlog})=>{
 await draft(page);await button(page,'Zamknij okno').click();await clear(page);await avatar(page).click();await expect(text(page)).toHaveValue('Darmowe Nitro! Kliknij link');
 await button(page,'Zamknij okno').click();await button(page,'Schowaj pomocnika').click();const restored=await serviceWorker.evaluate(async()=>{const out=[];for(const t of await chrome.tabs.query({}))out.push(await self.__aura.onActionClicked(t));return out;});expect(restored.filter(r=>r.ok&&r.via==='message')).toHaveLength(1);
 await avatar(page).click();await expect(text(page)).toHaveValue('Darmowe Nitro! Kliknij link');expect(await serviceWorker.evaluate(()=>self.__aura.messages.length)).toBe(0);await assertOnlyLocal(netlog);
});
test('new selection needs explicit replacement',async({page,netlog})=>{
 await draft(page);await button(page,'Zamknij okno').click();const next=await page.locator('#msg2').textContent();await page.locator('#msg2').selectText();await avatar(page).click();await expect(text(page)).toHaveValue('Darmowe Nitro! Kliknij link');await button(page,'Wstaw nowe zaznaczenie').click();await expect(text(page)).toHaveValue(next);await expect(page.getByRole('textbox',{name:'Link (jeśli jest)',exact:true})).toHaveValue('');await assertOnlyLocal(netlog);
});
test('identical selection needs no replacement button',async({page,netlog})=>{await draft(page,false);await button(page,'Zamknij okno').click();await page.locator('#msg').selectText();await avatar(page).click();await expect(button(page,'Wstaw nowe zaznaczenie')).toHaveCount(0);await assertOnlyLocal(netlog);});
test('reload and document navigation clear draft',async({page,netlog})=>{
 await draft(page);await page.reload();await clear(page);await avatar(page).click();await expect(page.locator('.menu')).toBeVisible();await button(page,'Zamknij okno').click();await page.locator('#msg').selectText();await avatar(page).click();await page.goto(other);await avatar(page).click();await expect(page.locator('.menu')).toBeVisible();await assertOnlyLocal(netlog);
});
test.describe('real bfcache',()=>{
 test.use({bfcache:true});
 test('Back restores a cached document with no old draft',async({page,netlog})=>{
  await draft(page);await page.evaluate(()=>{window.__restores=[];window.addEventListener('pageshow',e=>window.__restores.push(e.persisted));});
  await page.goto(other);await page.goBack({waitUntil:'commit'});
  await expect.poll(()=>page.evaluate(()=>window.__restores)).toContain(true);
  await expect(avatar(page)).toBeVisible();await clear(page);await avatar(page).click();await expect(page.locator('.menu')).toBeVisible();await assertOnlyLocal(netlog);
 });
 for (const step of ['question', 'result with edit']) test(`Back clears an approved ${step} session in a genuinely cached document`, async ({ page, serviceWorker, netlog }) => {
  await draft(page); await button(page, 'Zatwierdzam').click();
  await expect(page.getByText('Zanim sprawdzimy: nie podawaj hasła ani kodu i nie klikaj nieznanego linku.', { exact: true })).toBeVisible();
  await button(page, 'Dalej').click(); await page.getByLabel('Osoba, którą znam', { exact: true }).check(); await button(page, 'Dalej').click();
  await page.getByLabel('Podania kodu do konta', { exact: true }).check();
  if (step === 'result with edit') {
   await button(page, 'Dalej').click(); await page.getByLabel('Przez znaną mi aplikację, stronę lub kontakt', { exact: true }).check(); await button(page, 'Dalej').click();
   await expect(page.locator('.result-section')).toHaveCount(3); await button(page, 'Edytuj wiadomość').click(); await text(page).fill('Unfinished cached edit');
  }
  await page.evaluate(() => { window.__checkRestores = []; window.addEventListener('pageshow', event => window.__checkRestores.push(event.persisted)); });
  await page.goto(other); await avatar(page).click(); await expect(page.locator('.menu')).toBeVisible();
  await page.goBack({ waitUntil: 'commit' });
  await expect.poll(() => page.evaluate(() => window.__checkRestores)).toContain(true);
  await expect(avatar(page)).toBeVisible(); await expect(page.getByRole('dialog')).toBeHidden();
  await clear(page); await avatar(page).click(); await expect(page.locator('.menu')).toBeVisible();
  await expect(page.locator('input:checked')).toHaveCount(0); await expect(page.locator('.result-section')).toHaveCount(0);
  await expect(button(page, 'Wróć do sprawdzania')).toHaveCount(0); await button(page, 'Sprawdź wiadomość').click(); await expect(text(page)).toHaveValue('');
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(1); await assertOnlyLocal(netlog);
 });
});
test('same document SPA channel keeps edited draft',async({page,netlog})=>{await draft(page);await page.evaluate(()=>history.pushState({},'','/chat-like.html?kanal=2'));await button(page,'Zamknij okno').click();await clear(page);await avatar(page).click();await expect(text(page)).toHaveValue('Darmowe Nitro! Kliknij link');await assertOnlyLocal(netlog);});
test('draft uses no page storage or extension storage',async({page,serviceWorker,netlog})=>{await draft(page);expect(await page.evaluate(()=>[localStorage.length,sessionStorage.length])).toEqual([0,0]);expect(await serviceWorker.evaluate(()=>typeof chrome.storage)).toBe('undefined');expect(await serviceWorker.evaluate(()=>self.__aura.messages.length)).toBe(0);await assertOnlyLocal(netlog);});
test('first selected link prefills editable link field',async({page,netlog})=>{await draft(page,false);await expect(page.getByRole('textbox',{name:'Link (jeśli jest)',exact:true})).toHaveValue('https://discord-nitro-free.example/gift');await assertOnlyLocal(netlog);});
