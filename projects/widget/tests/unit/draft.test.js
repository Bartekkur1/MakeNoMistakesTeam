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

const storeAt = step => {
 const s = approvedStore();
 if (step === 'safety') return s;
 s.startQuestions();
 for (const [id, choice] of [['sender', 'known_person'], ['request', 'code'], ['verify', 'independent_channel']]) {
  s.answer(id, choice);
  if (step === id) return s;
  s.nextQuestion();
 }
 return s;
};

for (const step of ['safety', 'sender', 'request', 'verify', 'result']) {
 for (const interruption of ['close', 'hide']) test(`${interruption} and reopen restore ${step} with the same approved choices`, () => {
  const s = storeAt(step); const old = s.get().check;
  s[interruption](); expect(s.get().view).toBe('closed');
  expect(s.get().check).toBe(old); expect(s.get().pendingSelection).toBeNull();
  if (interruption === 'hide') { expect(s.get().hidden).toBe(true); s.show(); }
  s.onAvatarClick({ text: '' });
  expect(s.get().view).toBe(['safety', 'result'].includes(step) ? step : 'question');
  expect(s.get().check).toBe(old); expect(s.get().check.resumeStep).toBe(step);
  expect(s.get().draft).toBeNull(); expect(s.get().hidden).toBe(false);
 });

 test(`new selection at ${step} requires preview and successful approval to replace the session`, () => {
  const s = storeAt(step); const old = s.get().check;
  s.onAvatarClick({ text: 'First replacement', truncated: false });
  expect(s.get().check).toBe(old); expect(s.get().draft).toBeNull();
  expect(s.get().view).toBe(['safety', 'result'].includes(step) ? step : 'question');
  s.onAvatarClick({ text: 'Second replacement https://new.example/', truncated: true });
  expect(s.get().pendingSelection).toEqual({ text: 'Second replacement https://new.example/', truncated: true });
  s.checkNewSelection();
  expect(s.get()).toMatchObject({ view: 'preview', candidateKind: 'replacement', pendingSelection: null,
   draft: { text: 'Second replacement https://new.example/', link: 'https://new.example/', origin: 'selection', truncated: true } });
  expect(s.get().check).toBe(old);
  s.cancelCheckEdit(); expect(s.get().check).toBe(old); expect(s.get().check.resumeStep).toBe(step);
  expect(s.get().draft).toBeNull(); expect(s.get().candidateKind).toBeNull();
  s.onAvatarClick({ text: 'Accepted replacement' }); s.checkNewSelection();
  const c = caseModule.buildCase(s.get().draft); const token = s.beginSubmit();
  expect(s.get().check).toBe(old); s.cancelCheckEdit(); expect(s.get().draft.text).toBe('Accepted replacement');
  expect(s.approved(token, c)).toBe(true);
  expect(s.get().check).not.toBe(old); expect(s.get().check.case).toBe(c);
  expect(s.get().check).toMatchObject({ step: 'safety', resumeStep: 'safety', result: null, keptAnswers: {}, discrepancy: null,
   answers: { sender: [], request: [], verify: [] } });
  expect(s.approved(token, c)).toBe(false);
 });
}

test('deferred first approval while closed resumes the saved safety screen', () => {
 const s = createDraftStore(); s.submitPaste({ text: 'Deferred fictional message', link: '' });
 const c = caseModule.buildCase(s.get().draft); const token = s.beginSubmit(); s.close();
 expect(s.approved(token, c)).toBe(true); expect(s.get().view).toBe('closed');
 const old = s.get().check; s.onAvatarClick({ text: '' });
 expect(s.get().view).toBe('safety'); expect(s.get().check).toBe(old);
});

test('empty or identical captures do not offer a replacement and replacement without capture is a no-op', () => {
 const s = storeAt('request'); const old = s.get().check;
 for (const text of ['', ' \u00a0 ', '  Fictional ordinary message  ']) {
  s.onAvatarClick({ text }); expect(s.get().pendingSelection).toBeNull(); expect(s.get().check).toBe(old);
  const before = s.get(); s.checkNewSelection(); expect(s.get()).toBe(before);
 }
});

for (const kind of ['edit', 'replacement']) test(`${kind} candidate survives interruption and failed approval without changing old progress`, () => {
 const s = storeAt('request'); const old = s.get().check;
 if (kind === 'edit') s.editCheckContent();
 else { s.onAvatarClick({ text: 'Replacement candidate' }); s.checkNewSelection(); }
 s.edit({ text: 'Unaccepted candidate', link: 'https://candidate.example/' });
 const candidate = s.get().draft;
 s.hide(); s.show(); s.onAvatarClick({ text: 'Other selection' });
 expect(s.get().view).toBe('preview'); expect(s.get().candidateKind).toBe(kind);
 expect(s.get().draft).toBe(candidate); expect(s.get().check).toBe(old);
 const token = s.beginSubmit(); s.close(); expect(s.submitFailed(token)).toBe(true);
 expect(s.get()).toMatchObject({ view: 'closed', error: 'submit', submitting: false });
 expect(s.get().check).toBe(old); expect(s.get().draft).toBe(candidate);
 s.onAvatarClick({ text: '' }); expect(s.get().view).toBe('preview'); expect(s.get().error).toBe('submit');
 s.cancelCheckEdit(); expect(s.get().view).toBe('question'); expect(s.get().check).toBe(old);
});
