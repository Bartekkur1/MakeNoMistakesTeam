import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
const url='http://127.0.0.1:4173/chat-like.html';
async function preview(page,id='msg'){await page.goto(url);await page.locator('#'+id).selectText();await page.getByRole('button',{name:'Scamerinio',exact:true}).click();}
test('Polish characters and emoji reach case unchanged',async({page,serviceWorker,netlog})=>{
 await preview(page,'msg2');await page.getByRole('button',{name:'Zatwierdzam',exact:true}).click();await expect.poll(()=>serviceWorker.evaluate(()=>self.__aura.cases.length)).toBe(1);
 expect(await serviceWorker.evaluate(()=>self.__aura.cases[0])).toMatchObject({content:'Cześć! Jutro o 17:00 gramy w Minecrafta, będziesz? 🙂',link:''});await assertOnlyLocal(netlog);
});
test('empty edited content cannot be approved',async({page,serviceWorker,netlog})=>{
 await preview(page);await page.getByRole('textbox',{name:'Wiadomość',exact:true}).fill('   ');await expect(page.getByRole('button',{name:'Zatwierdzam',exact:true})).toBeDisabled();expect(await serviceWorker.evaluate(()=>self.__aura.messages.length)).toBe(0);await assertOnlyLocal(netlog);
});
test('suspicious URL is only text, never an anchor or request',async({page,netlog})=>{
 await preview(page);await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'Link (jeśli jest)',exact:true})).toHaveValue('https://discord-nitro-free.example/gift');await assertOnlyLocal(netlog);expect(netlog.entries.some(({url})=>url.includes('discord-nitro-free.example'))).toBe(false);
});
