import { test, expect, vi, afterEach } from 'vitest';
import { normalizeText, capCodePoints, buildCase, isValidCase } from '../../src/core/case.js';
import { captureSelection } from '../../src/content/capture.js';
import { createPanel } from '../../src/ui/panel.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();window.dispatchEvent(new Event('pagehide'));document.querySelectorAll('bezpieczna-aura-widget').forEach(el=>el.remove());});
test('NBSP, empty and single-character content',()=>{
 expect(normalizeText('\u00a0\u00a0 ')).toBe('');expect(normalizeText('a\u00a0b')).toBe('a b');
 for (const [raw,text] of [['   ',''],['a','a']])expect(captureSelection({activeElement:null,getSelection:()=>({toString:()=>raw})})).toEqual({text,truncated:false});
 expect(()=>buildCase({text:'  ',origin:'paste'})).toThrow('empty');expect(()=>buildCase({text:'x',origin:'inne'})).toThrow('origin');
});
test('Unicode code-point cap never splits emoji or applies NFC',()=>{
 const capped=capCodePoints('a'.repeat(1999)+'🙂b');expect(Array.from(capped.text)).toHaveLength(2000);expect(capped.text.endsWith('🙂')).toBe(true);expect(capped.truncated).toBe(true);
 const second=capCodePoints('a'.repeat(2000)+'🙂');expect(second.text).toBe('a'.repeat(2000));expect(second.text).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
 expect(capCodePoints('🙂'.repeat(2000))).toEqual({text:'🙂'.repeat(2000),truncated:false});
 for(const text of ['Zażółć gęślą jaźń 🙂','e\u0301'])expect(buildCase({text,origin:'paste'}).content).toBe(text);
});
test('case validator rejects extra fields, blank, oversized and foreign origins',()=>{
 const c=buildCase({text:'x',origin:'paste'});expect(isValidCase(c)).toBe(true);
 for(const bad of [{...c,extra:true},{...c,content:''},{...c,content:'a'.repeat(2001)},{...c,origin:'inne'}])expect(isValidCase(bad)).toBe(false);
});
test('password value is never read; textarea captures only selected substring',()=>{
 const read=vi.fn(()=>{throw new Error('password read');});const password={tagName:'INPUT',type:'password',get value(){return read();}};const selection=vi.fn();
 expect(captureSelection({activeElement:password,getSelection:selection})).toEqual({text:'',truncated:false});expect(read).not.toHaveBeenCalled();expect(selection).not.toHaveBeenCalled();
 expect(captureSelection({activeElement:{tagName:'TEXTAREA',value:'Moje imie',selectionStart:0,selectionEnd:4}}).text).toBe('Moje');
});
test('preview guards empty, explains truncation and keeps links as plain text',()=>{
 const root=document.createElement('div').attachShadow({mode:'open'});const panel=createPanel({root,strings:STRINGS,handlers:{}});
 panel.render({view:'preview',draft:{text:'   ',link:'',truncated:true},error:'submit'},{host:'example.test'});
 expect([...root.querySelectorAll('button')].find(b=>b.textContent===STRINGS.approve).disabled).toBe(true);expect(root.textContent).toContain(STRINGS.truncatedNotice);expect(root.textContent).toContain(STRINGS.submitError);
 expect(root.querySelector('textarea').value).toBe('   ');
 for(const view of ['menu','paste','howto','preview','confirmation']){panel.render({view,paste:{text:'',link:''},draft:{text:'x',link:'https://x.example'}},{host:'example.test'});expect(root.querySelectorAll('a')).toHaveLength(0);}
});
for(const late of [false,true])test(`integration failure and late answer, pagehide=${late}`,async()=>{
 vi.resetModules();let resolve;const send=late?vi.fn(()=>new Promise(r=>{resolve=r;})):vi.fn(async()=>{throw new Error('Extension context invalidated.');});
 vi.stubGlobal('chrome',{runtime:{id:'test-ext',sendMessage:send,onMessage:{addListener:vi.fn()}}});vi.spyOn(document,'getSelection').mockReturnValue({toString:()=> 'Fictional'});
 await import('../../src/content/main.js');const root=document.querySelector('bezpieczna-aura-widget').shadowRoot;root.querySelector('.avatar').click();[...root.querySelectorAll('button')].find(b=>b.textContent===STRINGS.approve).click();
 if(late){window.dispatchEvent(new Event('pagehide'));resolve({ok:true});await new Promise(r=>setTimeout(r,10));expect(root.querySelector('.panel').hidden).toBe(true);expect(root.textContent).not.toContain(STRINGS.confirmationHeading);}
 else{await vi.waitFor(()=>expect(root.textContent).toContain(STRINGS.submitError));expect(root.querySelector('textarea').value).toBe('Fictional');expect(root.textContent).not.toContain(STRINGS.confirmationHeading);}
});
test('active iframe never reads a stale top-document selection',()=>{
 const selection=vi.fn(()=>({toString:()=> 'Stale top-page selection'}));
 expect(captureSelection({activeElement:{tagName:'IFRAME'},getSelection:selection})).toEqual({text:'',truncated:false});expect(selection).not.toHaveBeenCalled();
});
