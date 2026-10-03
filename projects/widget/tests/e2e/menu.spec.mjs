import { test, expect, assertOnlyLocal } from './extension.fixture.mjs';
import { STRINGS } from '../../src/ui/strings.pl.js';
const url='http://127.0.0.1:4173/chat-like.html';
const avatar=p=>p.getByRole('button',{name:'Scamerinio',exact:true});
const button=(p,name)=>p.getByRole('button',{name,exact:true});
const text=p=>p.getByRole('textbox',{name:'Wiadomość',exact:true});
const link=p=>p.getByRole('textbox',{name:'Link (jeśli jest)',exact:true});
async function open(page){await page.goto(url);await avatar(page).click();}
test('empty selection shows ordered two-button menu',async({page,netlog})=>{
 await open(page);expect(await page.locator('.menu button').allTextContents()).toEqual([STRINGS.menuCheck,STRINGS.menuHowTo]);await assertOnlyLocal(netlog);
});
test('instructions show three ordered steps and privacy sentence',async({page,netlog})=>{
 await open(page);await button(page,STRINGS.menuHowTo).click();expect(await page.locator('ol li').allTextContents()).toEqual(STRINGS.howToSteps);await expect(page.getByText(STRINGS.howToPrivacy,{exact:true})).toBeVisible();await button(page,STRINGS.back).click();await expect(page.locator('.menu')).toBeVisible();await assertOnlyLocal(netlog);
});
test('paste text and link then preview and deliberately approve',async({page,serviceWorker,netlog})=>{
 await open(page);await button(page,STRINGS.menuCheck).click();await expect(button(page,STRINGS.next)).toBeDisabled();
 const content='Wygrałeś kartę podarunkową! Podaj hasło do konta, żeby ją odebrać.',urlLink='https://gift-card-promo.example/odbierz';
 await text(page).fill(content);await link(page).fill(urlLink);await button(page,STRINGS.next).click();await expect(text(page)).toHaveValue(content);await expect(link(page)).toHaveValue(urlLink);await expect(page.getByText(STRINGS.guardianNotice,{exact:true})).toBeVisible();await expect(page.getByText('Ze strony: 127.0.0.1',{exact:true})).toBeVisible();expect(await serviceWorker.evaluate(()=>self.__aura.messages.length)).toBe(0);
 await button(page,STRINGS.approve).click();await expect(page.getByText(STRINGS.safetyNotice,{exact:true})).toBeVisible();expect(await serviceWorker.evaluate(()=>self.__aura.cases[0])).toMatchObject({origin:'paste',link:urlLink,content});await assertOnlyLocal(netlog);
});
test('panel sits near avatar, flips below and stays in viewport',async({page,netlog})=>{
 await open(page);const panel=page.getByRole('dialog');let p=await panel.boundingBox(),a=await avatar(page).boundingBox();const viewport=page.viewportSize();expect(p.width).toBeLessThanOrEqual(320);expect(p.x).toBeGreaterThanOrEqual(8);expect(p.y).toBeGreaterThanOrEqual(8);expect(p.x+p.width).toBeLessThanOrEqual(viewport.width-8);expect(p.y+p.height).toBeLessThanOrEqual(viewport.height-8);expect(Math.min(Math.abs(a.y-p.y-p.height),Math.abs(p.y-a.y-a.height))).toBeLessThanOrEqual(14);
 await button(page,STRINGS.closeLabel).click();await page.mouse.move(a.x+32,a.y+32);await page.mouse.down();await page.mouse.move(40,40,{steps:10});await page.mouse.up();await avatar(page).click();p=await panel.boundingBox();a=await avatar(page).boundingBox();expect(p.y).toBeGreaterThanOrEqual(a.y+a.height);expect(p.x).toBeGreaterThanOrEqual(8);expect(p.y+p.height).toBeLessThanOrEqual(viewport.height-8);await assertOnlyLocal(netlog);
});
test('Escape closes focused menu',async({page,netlog})=>{await open(page);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await assertOnlyLocal(netlog);});
test('paste buffer survives close and back but clears on reload',async({page,serviceWorker,netlog})=>{
 await open(page);await button(page,STRINGS.menuCheck).click();await text(page).fill('Hej, to test');await link(page).fill('https://promo.example/x');await button(page,STRINGS.closeLabel).click();await avatar(page).click();await expect(text(page)).toHaveValue('Hej, to test');await expect(link(page)).toHaveValue('https://promo.example/x');await button(page,STRINGS.back).click();await button(page,STRINGS.menuCheck).click();await expect(text(page)).toHaveValue('Hej, to test');await page.reload();await avatar(page).click();await expect(page.locator('.menu')).toBeVisible();expect(await serviceWorker.evaluate(()=>self.__aura.messages.length)).toBe(0);await assertOnlyLocal(netlog);
});
test('iframe selection offers manual paste',async({page,serviceWorker,netlog})=>{
 const fixture='http://127.0.0.1:4173/fields.html';await page.goto(fixture);await page.frameLocator('#ramka').locator('#msg-in-frame').selectText();await avatar(page).click();await expect(page.locator('.menu')).toBeVisible();await button(page,STRINGS.menuCheck).click();await text(page).fill('Wiadomość w ramce: darmowe Nitro');await button(page,STRINGS.next).click();await expect(text(page)).toHaveValue('Wiadomość w ramce: darmowe Nitro');expect(await serviceWorker.evaluate(()=>self.__aura.messages.length)).toBe(0);await assertOnlyLocal(netlog,{mustInclude:fixture});
});
test('panel fits a narrow resized viewport',async({page,netlog})=>{
 await open(page);await page.setViewportSize({width:280,height:500});const r=await page.getByRole('dialog').boundingBox();expect(r.x).toBeGreaterThanOrEqual(8);expect(r.x+r.width).toBeLessThanOrEqual(272);await assertOnlyLocal(netlog);
});
