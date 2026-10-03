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

const approvedStore = () => {
 const s=createDraftStore();s.submitPaste({text:'Fictional ordinary message',link:''});
 const c=caseModule.buildCase(s.get().draft);s.approved(s.beginSubmit(),c);return s;
};
test('question ordering requires explicit answers and Back and fix retain choices',()=>{
 const s=approvedStore();expect(s.get().check.step).toBe('safety');s.startQuestions();
 for(const [id,choice] of [['sender','known_person'],['request','ordinary'],['verify','independent_channel']]){
  expect(s.get().check.step).toBe(id);expect(s.get().check.answers[id]).toEqual([]);
  const before=s.get();s.nextQuestion();expect(s.get()).toBe(before);s.answer(id,choice);s.nextQuestion();
 }
 expect(s.get().view).toBe('result');expect(s.get().check.result.summaryKey).toBe('no_signals');
 const answers=s.get().check.answers;s.fixAnswers();expect(s.get().check.answers).toBe(answers);expect(s.get().check.step).toBe('sender');
 s.previousQuestion();expect(s.get().view).toBe('safety');s.startQuestions();s.nextQuestion();s.previousQuestion();
 expect(s.get().check.step).toBe('sender');expect(s.get().check.answers).toBe(answers);
 s.answer('sender','unknown');s.nextQuestion();s.nextQuestion();s.nextQuestion();
 expect(s.get().check.result.summaryKey).toBe('insufficient_information');expect(s.get().check.result.unknowns).toContain('sender');
});
test('request unknown and ordinary are exclusive and concrete options can toggle',()=>{
 const s=approvedStore();s.startQuestions();s.answer('sender','unknown');s.nextQuestion();
 for(const exclusive of ['unknown','ordinary']){
  s.answer('request',exclusive);expect(s.get().check.answers.request).toEqual([exclusive]);
  s.answer('request','code');s.answer('request','payment');expect(s.get().check.answers.request).toEqual(['code','payment']);
  s.answer('request',exclusive);expect(s.get().check.answers.request).toEqual([exclusive]);
  s.answer('request',exclusive);expect(s.get().check.answers.request).toEqual([]);
 }
 s.answer('request','code');s.answer('request','code');expect(s.get().check.answers.request).toEqual([]);
});
test('invalid answers and transitions without an active check never mutate state',()=>{
 const empty=createDraftStore();const before=empty.get();
 empty.startQuestions();empty.answer('sender','unknown');empty.nextQuestion();empty.previousQuestion();empty.fixAnswers();expect(empty.get()).toBe(before);
 const s=approvedStore();s.startQuestions();const snapshot=s.get();
 for(const [question,answer] of [['sender','invalid'],['request','code'],['other','unknown'],['__proto__','unknown'],['sender',null]]){s.answer(question,answer);expect(s.get()).toBe(snapshot);}
 s.answer('sender','unknown');expect(Object.isFrozen(s.get().check.answers.sender)).toBe(true);
 expect(()=>s.get().check.answers.sender.push('known_person')).toThrow();
 expect(snapshot.check.answers.sender).toEqual([]);
});
