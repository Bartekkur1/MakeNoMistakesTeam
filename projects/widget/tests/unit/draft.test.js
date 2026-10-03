import { test, expect } from 'vitest';
import { createDraftStore } from '../../src/core/draft.js';
import * as caseModule from '../../src/core/case.js';
test('new selection never replaces an edited draft without consent', () => {
 const s=createDraftStore();s.onAvatarClick({text:''});expect(s.get().view).toBe('menu');
 s.onAvatarClick({text:'abc'});s.edit({text:'ab'});s.close();s.onAvatarClick({text:''});expect(s.get().draft.text).toBe('ab');expect(s.get().pendingSelection).toBeNull();
 s.onAvatarClick({text:'nowe'});expect(s.get().draft.text).toBe('ab');expect(s.get().pendingSelection).toEqual({text:'nowe',truncated:false});
 s.insertPendingSelection();expect(s.get().draft).toMatchObject({text:'nowe',origin:'selection'});expect(s.get().pendingSelection).toBeNull();
 s.onAvatarClick({text:' nowe '});expect(s.get().pendingSelection).toBeNull();
});
test('closing and hiding discard only pending selection; submission locks replacement',()=>{
 const s=createDraftStore();s.onAvatarClick({text:'abc'});s.onAvatarClick({text:'new'});const token=s.beginSubmit();s.insertPendingSelection();expect(s.get().draft.text).toBe('abc');
 s.close();expect(s.get().pendingSelection).toBeNull();s.submitFailed(token);s.onAvatarClick({text:'new'});s.hide();s.show();expect(s.get().pendingSelection).toBeNull();expect(s.get().draft.text).toBe('abc');
 s.resetForNewDocument();expect(s.get()).toMatchObject({view:'closed',draft:null,pendingSelection:null,hidden:false,error:null,submitting:false,paste:{text:'',link:''}});expect(s.get().gen).toBeGreaterThan(token);
});
test('first selected URL is plain text with trailing punctuation removed',()=>{
 for (const [input,out] of [['Kliknij: https://discord-nitro-free.example/gift.','https://discord-nitro-free.example/gift'],['wejdz na www.nitro.example/x, szybko','www.nitro.example/x'],['(https://a.example/b)','https://a.example/b'],['bez linku',''],['https://a.example/x https://b.example/y','https://a.example/x']]) expect(caseModule.extractFirstLink(input)).toBe(out);
 const s=createDraftStore();s.onAvatarClick({text:'Hej! https://a.example/x'});expect(s.get().draft.link).toBe('https://a.example/x');
});
