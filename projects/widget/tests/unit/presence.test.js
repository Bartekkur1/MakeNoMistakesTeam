import { test, expect, vi, afterEach } from 'vitest';
import * as avatarModule from '../../src/content/avatar.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
const chromeStub = () => ({ runtime: { id: 'test-ext', onMessage: { addListener: vi.fn() } }, tabs: { sendMessage: vi.fn() }, scripting: { executeScript: vi.fn() }, action: { onClicked: { addListener: vi.fn() } } });
const cleanup = [];
async function bootForm() {
  const c = chromeStub(); c.runtime.sendMessage = vi.fn(); vi.stubGlobal('chrome', c);
  vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => '' });
  vi.resetModules(); await import('../../src/content/main.js');
  const host = document.querySelector('bezpieczna-aura-widget'), root = host.shadowRoot;
  const click = name => [...root.querySelectorAll('button')].find(b => b.textContent === name).click();
  const check = (open, panelVisible = true) => {
    expect(host.style.display).toBe('block');
    expect(root.querySelector('.avatar-wrap').style.visibility).not.toBe('hidden');
    expect(root.querySelector('.avatar-wrap').inert).not.toBe(true);
    expect(root.querySelector('.panel').hidden).toBe(!panelVisible);
  };
  return { c, host, root, click, check };
}
test('form keeps avatar usable and retains draft after close and Escape', async () => {
  const { c, host, root, click, check } = await bootForm();
  root.querySelector('.avatar').click(); check(false);
  click(STRINGS.menuHowTo); check(false); click(STRINGS.back); check(false);
  click(STRINGS.menuCheck); check(true);
  const text = root.querySelector('textarea'); text.value = 'Fikcyjny szkic'; text.dispatchEvent(new Event('input'));
  click(STRINGS.next); check(true);
  root.querySelector('[aria-label="Zamknij okno"]').click(); check(false, false);
  root.querySelector('.avatar').click(); check(true); expect(root.querySelector('textarea').value).toBe('Fikcyjny szkic');
  root.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); check(false, false);
  root.querySelector('.hide').click(); expect(host.style.display).toBe('none');
  c.runtime.onMessage.addListener.mock.calls[0][0]({type:'aura/show'}, {id:'test-ext'}, vi.fn()); check(false, false);
  root.querySelector('.avatar').click(); check(true); expect(root.querySelector('textarea').value).toBe('Fikcyjny szkic');
});
test('selection preview keeps avatar usable during pending and failed submit and confirmation', async () => {
  const { c, root, click, check } = await bootForm();
  document.getSelection.mockReturnValue({ toString: () => 'Fikcyjne zaznaczenie' });
  root.querySelector('.avatar').click(); check(true);
  expect(root.querySelector('textarea').value).toBe('Fikcyjne zaznaczenie');
  let resolve; c.runtime.sendMessage.mockImplementation(() => new Promise(r => { resolve = r; }));
  click(STRINGS.approve); check(true); expect(root.querySelector('textarea').readOnly).toBe(true);
  resolve({ ok: false }); await vi.waitFor(() => expect(root.querySelector('.error')).not.toBeNull()); check(true);
  click(STRINGS.approve); check(true); resolve({ ok: true });
  await vi.waitFor(() => expect(root.textContent).toContain(STRINGS.confirmationHeading)); check(false);
});
afterEach(() => { for (const fn of cleanup.splice(0)) fn(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.querySelectorAll('bezpieczna-aura-widget').forEach(el => el.remove()); });
test('drag threshold and viewport clamp', () => {
  for (const [x,y,result] of [[5,0,false],[3,4,false],[6,0,true],[4,4,true]]) expect(avatarModule.isDrag(x,y)).toBe(result);
  expect(avatarModule.clampToViewport({x:-50,y:-50},{width:1280,height:720})).toEqual({x:8,y:8});
  expect(avatarModule.clampToViewport({x:1300,y:800},{width:1280,height:720})).toEqual({x:1208,y:648});
  expect(avatarModule.clampToViewport({x:500,y:300},{width:1280,height:720})).toEqual({x:500,y:300});
  expect(avatarModule.clampToViewport({x:0,y:0},{width:50,height:50})).toEqual({x:8,y:8});
});
for (const [x,y,calls] of [[130,100,0],[103,104,1]]) test(`gesture ${x},${y}`, () => {
  const host = document.createElement('div'); const root = host.attachShadow({ mode: 'open' });
  const activate = vi.fn(), move = vi.fn(); const selection = vi.spyOn(document,'getSelection').mockReturnValue({toString:()=>''});
  const a = avatarModule.createAvatar({host,root,strings:STRINGS,onActivate:activate,onHide:vi.fn(),onMove:move});
  expect(move).not.toHaveBeenCalled();
  for (const [type,cx,cy] of [['pointerdown',100,100],['pointermove',x,y],['pointerup',x,y]]) a.el.dispatchEvent(new PointerEvent(type,{clientX:cx,clientY:cy,pointerId:1}));
  a.el.click(); expect(activate).toHaveBeenCalledTimes(calls); expect(selection).toHaveBeenCalledTimes(calls);
  expect(move).toHaveBeenCalledTimes(calls ? 0 : 1);
  if (!calls) expect(move).toHaveBeenCalledWith(a.rect());
  if (!calls) expect(host.style.left).not.toBe('');
});
test('empty body, duplicate live boot, foreign and orphan recovery with acknowledged restore', async () => {
  document.body.replaceChildren(); const c = chromeStub(); vi.stubGlobal('chrome',c);
  const foreign = document.createElement('bezpieczna-aura-widget'); document.documentElement.append(foreign);
  vi.resetModules(); await import('../../src/content/main.js');
  const first = document.querySelector('bezpieczna-aura-widget'); expect(first).not.toBe(foreign); expect(first.parentNode).toBe(document.documentElement);
  vi.resetModules(); await import('../../src/content/main.js'); expect(document.querySelector('bezpieczna-aura-widget')).toBe(first);
  c.runtime.id = undefined; const next = chromeStub(); vi.stubGlobal('chrome',next);
  vi.resetModules(); await import('../../src/content/main.js');
  const host = document.querySelector('bezpieczna-aura-widget'); expect(host).not.toBe(first); expect(document.querySelectorAll('bezpieczna-aura-widget')).toHaveLength(1);
  const root = host.shadowRoot; root.querySelector('.hide').click(); expect(host.style.display).toBe('none');
  const listener = next.runtime.onMessage.addListener.mock.calls[0][0]; const response = vi.fn();
  listener({type:'aura/show'},{id:'other'},response); expect(response).not.toHaveBeenCalled();
  listener({type:'aura/show'},{id:'test-ext'},response); expect(response).toHaveBeenCalledWith({ok:true}); expect(host.style.display).toBe('block');
});
for (const mode of ['message','inject','no-ack','inject-failed','none']) test(`toolbar ${mode}`, async () => {
  const c = chromeStub(); vi.stubGlobal('chrome',c);
  if (mode === 'message') c.tabs.sendMessage.mockResolvedValue({ok:true});
  if (mode === 'inject') c.tabs.sendMessage.mockRejectedValueOnce(new Error('missing')).mockResolvedValue({ok:true});
  if (mode === 'inject-failed') c.scripting.executeScript.mockRejectedValue(new Error('Cannot access a chrome:// URL'));
  vi.resetModules(); const {onActionClicked} = await import('../../src/background/sw.js');
  expect(await onActionClicked(mode === 'none' ? {} : {id:7})).toEqual({ok:['message','inject'].includes(mode),via:mode});
  if (mode === 'inject') { expect(c.scripting.executeScript).toHaveBeenCalledWith({target:{tabId:7},files:['content.js']}); expect(c.tabs.sendMessage).toHaveBeenCalledTimes(2); }
  if (['message','none'].includes(mode)) expect(c.scripting.executeScript).not.toHaveBeenCalled();
});
