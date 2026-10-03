import { test, expect, vi } from 'vitest';
import * as panelModule from '../../src/ui/panel.js';
import { createDraftStore } from '../../src/core/draft.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
const setup = () => { const root=document.createElement('div').attachShadow({mode:'open'}); const handlers=Object.fromEntries(['onClose','onCheck','onHowTo','onBack','onPasteEdit','onPasteNext'].map(k=>[k,vi.fn()])); return {root,handlers,panel:panelModule.createPanel({root,strings:STRINGS,handlers})}; };
test('panel position prefers above, flips and clamps', () => {
  const position = panelModule.computePanelPosition;
  expect(position({left:1192,top:560,right:1256,bottom:624},{width:320,height:300},{width:1280,height:720})).toEqual({left:936,top:248});
  expect(position({left:600,top:20,right:664,bottom:84},{width:320,height:300},{width:1280,height:720}).top).toBe(96);
  expect(position({left:8,top:20,right:72,bottom:84},{width:320,height:300},{width:1280,height:200})).toEqual({left:8,top:8});
});
test('menu and instructions have fixed order and Escape closes', () => {
  const {panel,root,handlers}=setup(); panel.render({view:'menu'},{});
  expect([...root.querySelectorAll('.menu button')].map(b=>b.textContent)).toEqual([STRINGS.menuCheck,STRINGS.menuHowTo]);
  panel.render({view:'howto'},{}); expect([...root.querySelectorAll('ol li')].map(el=>el.textContent)).toEqual(STRINGS.howToSteps);
  expect(root.querySelector('.privacy').textContent).toBe(STRINGS.howToPrivacy);
  panel.el.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); expect(handlers.onClose).toHaveBeenCalledOnce();
});
test('paste remembers values, guards blank text and submits current fields', () => {
  const {panel,root,handlers}=setup(); panel.render({view:'paste',paste:{text:'Hej',link:'https://x.example'}},{});
  const text=root.querySelector('textarea'),link=root.querySelector('input'); const next=[...root.querySelectorAll('button')].find(b=>b.textContent===STRINGS.next);
  expect(text.value).toBe('Hej'); expect(link.value).toBe('https://x.example'); expect(next.disabled).toBe(false);
  for (const value of ['', '   ', '\u00a0', 'a']) { text.value=value; text.dispatchEvent(new Event('input')); expect(next.disabled).toBe(value!=='a'); }
  link.value='https://y.example';link.dispatchEvent(new Event('input')); next.click();
  expect(handlers.onPasteNext).toHaveBeenCalledWith({text:'a',link:'https://y.example'});expect(handlers.onPasteEdit).toHaveBeenCalledWith({link:'https://y.example'});
});
test('paste store transitions retain buffer until preview or reset', () => {
  const s=createDraftStore(); s.showHowTo();expect(s.get().view).toBe('howto'); s.showPaste();
  s.editPaste({text:'Hej'});s.editPaste({link:'https://x.example',extra:'ignored'});
  s.close();s.hide();s.back();s.onAvatarClick({text:''});expect(s.get().view).toBe('paste');
  expect(s.get().paste).toEqual({text:'Hej',link:'https://x.example'});
  s.submitPaste({text:'  ',link:''});expect(s.get()).toMatchObject({view:'paste',error:'empty'});
  s.submitPaste({text:'Hej',link:' https://x.example '});expect(s.get()).toMatchObject({view:'preview',draft:{text:'Hej',link:'https://x.example',origin:'paste',truncated:false},paste:{text:'',link:''}});
  s.resetForNewDocument();s.onAvatarClick({text:''});expect(s.get().view).toBe('menu');
});
