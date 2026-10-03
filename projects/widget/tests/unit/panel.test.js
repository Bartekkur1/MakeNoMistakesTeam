import { test, expect, vi, afterEach } from 'vitest';
import * as panelModule from '../../src/ui/panel.js';
import { createDraftStore } from '../../src/core/draft.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
import { buildCase } from '../../src/core/case.js';
import { detectHints, evaluate } from '../../src/core/check.js';
const hosts = [];
afterEach(() => { for (const host of hosts.splice(0)) host.remove(); });
const setup = () => { const host = document.createElement('div'); document.body.append(host); hosts.push(host); const root=host.attachShadow({mode:'open'}); const handlers=Object.fromEntries(['onClose','onCheck','onHowTo','onBack','onPasteEdit','onPasteNext','onSafetyNext','onAnswer','onQuestionNext','onQuestionBack','onFixAnswers','onEditCheckContent','onCancelCheckEdit','onCheckNewSelection','onInsertSelection','onEdit','onApprove'].map(k=>[k,vi.fn()])); return {root,handlers,panel:panelModule.createPanel({root,strings:STRINGS,handlers})}; };
const checkStore = () => {
  const store = createDraftStore(); store.submitPaste({ text: 'Podaj kod do konta', link: '' });
  const c = buildCase(store.get().draft); store.approved(store.beginSubmit(), c);
  return store;
};
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

for (const question of STRINGS.checkQuestions) test(`question ${question.id} has labeled native choices and explicit Next`, () => {
  const { panel, root, handlers } = setup();
  const store = checkStore();
  const check = { ...store.get().check, step: question.id };
  panel.render({ view: 'question', check }, {});
  expect(root.querySelector('legend').textContent).toBe(question.title);
  const inputs = [...root.querySelectorAll('fieldset input')];
  expect(inputs.map(input => input.value)).toEqual(question.options.map(option => option.id));
  expect(inputs.every(input => input.type === (question.multiple ? 'checkbox' : 'radio'))).toBe(true);
  const next = [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.next);
  expect(next.disabled).toBe(true);
  for (const [index, input] of inputs.entries()) {
    const label = root.querySelector(`label[for="${input.id}"]`);
    expect(label.textContent).toBe(question.options[index].label);
    expect(input.checked).toBe(false);
    input.focus(); input.checked = true; input.dispatchEvent(new Event('change'));
    expect(handlers.onAnswer).toHaveBeenLastCalledWith(question.id, input.value);
  }
  expect(root.querySelectorAll('a')).toHaveLength(0);
  expect(root.querySelectorAll('input:checked')).toHaveLength(question.multiple ? inputs.length : 1);
  panel.render({ view: 'question', check: { ...check, answers: { ...check.answers, [question.id]: ['unknown'] } } }, {});
  expect(root.querySelector('input[value="unknown"]').checked).toBe(true);
  expect([...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.next).disabled).toBe(false);
  [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.next).click();
  expect(handlers.onQuestionNext).toHaveBeenCalledOnce();
  [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.back).click();
  expect(handlers.onQuestionBack).toHaveBeenCalledOnce();
});

test('answer rendering keeps keyboard focus on the chosen option including unknown', () => {
  const { panel, root, handlers } = setup();
  const store = checkStore(); store.startQuestions();
  handlers.onAnswer.mockImplementation((question, answer) => { store.answer(question, answer); panel.render(store.get(), {}); });
  panel.render(store.get(), {});
  for (const id of ['claims_organization', 'unknown_sender', 'unknown']) {
    const input = root.querySelector(`input[value="${id}"]`);
    input.focus(); input.checked = true; input.dispatchEvent(new Event('change'));
    expect(root.activeElement?.value).toBe(id);
    expect(root.querySelector(`input[value="${id}"]`).checked).toBe(true);
  }
});

test('safety and result controls invoke handlers and render exactly three sections and one action', () => {
  const { panel, root, handlers } = setup(); const store = checkStore();
  panel.render(store.get(), {}); expect(root.textContent).toContain(STRINGS.safetyNotice);
  [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.next).click();
  expect(handlers.onSafetyNext).toHaveBeenCalledOnce(); store.startQuestions();
  for (const question of STRINGS.checkQuestions) { store.answer(question.id, 'unknown'); store.nextQuestion(); }
  panel.render(store.get(), {});
  expect([...root.querySelectorAll('h3')].map(el => el.textContent)).toEqual(Object.values(STRINGS.resultSections));
  expect(root.querySelectorAll('.result-step')).toHaveLength(1);
  expect(root.textContent).toContain(STRINGS.checkSignals.code);
  expect(root.textContent).toContain(STRINGS.checkSteps[store.get().check.result.step.explanationKey]);
  expect(root.querySelectorAll('a')).toHaveLength(0);
  [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.fixAnswers).click();
  expect(handlers.onFixAnswers).toHaveBeenCalledOnce();
});

test('honest result explicitly states absent signals and additional unknowns without guaranteeing safety', () => {
  const { panel, root } = setup();
  const out = evaluate({ sender: ['known_person'], request: ['ordinary'], verify: ['independent_channel'] }, detectHints({ text: 'Dziś gramy o 17' }));
  panel.render({ view: 'result', check: { result: out } }, {});
  const sections = [...root.querySelectorAll('.result-section')];
  expect(sections[0].textContent).toContain('Nie widzę typowych sygnałów oszustwa w wiadomości ani w Twoich odpowiedziach.');
  expect(sections[1].textContent).toContain('Nie wskazano dodatkowych brakujących informacji. To nie potwierdza tożsamości nadawcy ani bezpieczeństwa wiadomości.');
  expect(root.querySelector('h2').textContent).toBe(STRINGS.checkSummaries.no_signals);
  expect(root.textContent).not.toMatch(/wiadomość jest bezpieczna|nadawca jest wiarygodny/i);
});

for (const request of ['payment', 'prize']) test(`caution for a standalone ${request} answer renders its reason without the no-signals fallback`, () => {
  const { panel, root } = setup();
  const out = evaluate({ sender: ['known_person'], request: [request], verify: ['independent_channel'] }, null);
  panel.render({ view: 'result', check: { result: out } }, {});
  expect(root.textContent).not.toContain(STRINGS.checkSignals.none);
  expect(root.querySelector('h2').textContent).toBe(STRINGS.checkSummaries.caution);
  expect(root.querySelector('.result-section').textContent).toContain(STRINGS.checkSignals[request]);
  expect(root.querySelector('.result-step').textContent).toContain(STRINGS.checkSteps['verify_' + request]);
});

for (const [text, absentUnknown] of [['Kliknij, tylko dziś', 'urgency'], ['Podaj kod do konta', 'request']]) {
  test(`unknown answer renders no conflicting missing-fact statement: ${text}`, () => {
    const { panel, root } = setup();
    const out = evaluate({ sender: ['known_person'], request: ['unknown'], verify: ['independent_channel'] }, detectHints({ text }));
    panel.render({ view: 'result', check: { result: out } }, {});
    expect(root.textContent).not.toContain(STRINGS.checkUnknowns[absentUnknown]);
    expect(root.querySelector('.result-section').textContent).not.toContain(STRINGS.checkSignals.none);
  });
}

for (const [name, text, answers] of [
  ['password', 'Prześlij hasło do konta', { sender: ['known_person'], request: ['password'], verify: ['independent_channel'] }],
  ['code conflict', 'Podaj kod do konta', { sender: ['known_person'], request: ['ordinary'], verify: ['independent_channel'] }],
  ['prize', 'Odbierz darmową nagrodę: https://nagroda.example/prezent', { sender: ['claims_organization'], request: ['prize'], verify: ['message_link'] }],
  ['payment', 'Zapłać natychmiast, inaczej stracisz konto.', { sender: ['unknown_sender'], request: ['payment', 'urgency'], verify: ['no_channel'] }],
  ['urgency', 'Kliknij, tylko dziś', { sender: ['known_person'], request: ['urgency'], verify: ['independent_channel'] }],
  ['unknown', 'Zobacz to', { sender: ['unknown'], request: ['unknown'], verify: ['unknown'] }],
  ['honest', 'Dziś gramy o 17', { sender: ['known_person'], request: ['ordinary'], verify: ['independent_channel'] }],
]) test(`result ${name} resolves every key into three named Polish sections and one explanation`, () => {
  const { panel, root } = setup();
  const out = evaluate(answers, detectHints({ text }));
  panel.render({ view: 'result', check: { result: out } }, {});
  expect(root.querySelector('h2').textContent).toBe(STRINGS.checkSummaries[out.summaryKey]);
  const sections = [...root.querySelectorAll('.result-section')];
  expect(sections).toHaveLength(3);
  for (const [index, key] of ['signals', 'unknowns'].entries()) {
    const copy = key === 'signals' ? STRINGS.checkSignals : STRINGS.checkUnknowns;
    expect([...sections[index].querySelectorAll('li')].map(li => li.textContent)).toEqual((out[key].length ? out[key] : ['none']).map(id => copy[id]));
  }
  for (const [index, key] of ['signals', 'unknowns', 'step'].entries()) {
    const title = root.getElementById(sections[index].getAttribute('aria-labelledby'));
    expect(title?.textContent).toBe(STRINGS.resultSections[key]);
  }
  expect(root.querySelectorAll('.result-step')).toHaveLength(1);
  expect([...root.querySelectorAll('.result-step p')].map(p => p.textContent)).toEqual([STRINGS.checkSteps[out.step.id], STRINGS.checkSteps[out.step.explanationKey]]);
  expect(root.textContent).not.toMatch(/undefined|credential_|prize_link|payment_pressure|official_channel|_how|no_signals|insufficient_information|conflicting_answers/);
  expect(root.querySelectorAll('a')).toHaveLength(0);
});

test('labelled hints leave controls untouched and mismatch buttons use explicit correction and retention callbacks', () => {
  const { panel, root, handlers } = setup();
  const store = checkStore(); store.startQuestions(); store.answer('sender', 'known_person'); store.nextQuestion();
  panel.render(store.get(), {});
  expect(root.querySelectorAll('.hint-badge')).toHaveLength(1);
  expect(root.querySelector('.hint-badge').textContent).toBe('Podpowiedź z wiadomości');
  expect(root.querySelectorAll('input:checked')).toHaveLength(0);
  store.answer('request', 'ordinary'); store.nextQuestion(); panel.render(store.get(), {});
  expect(root.querySelector('input[value="ordinary"]').checked).toBe(true);
  expect(root.querySelector('input[value="code"]').checked).toBe(false);
  const click = text => [...root.querySelectorAll('button')].find(button => button.textContent === text).click();
  click(STRINGS.correctAnswer); expect(handlers.onAnswer).toHaveBeenCalledWith('request', 'code');
  click(STRINGS.keepAnswer); expect(handlers.onQuestionNext).toHaveBeenLastCalledWith(true);
  click(STRINGS.next); expect(handlers.onQuestionNext).toHaveBeenLastCalledWith(false);
});

for (const step of ['safety', 'sender', 'request', 'verify', 'result']) test(`replacement control at ${step} requires a captured selection and invokes only its callback`, () => {
 const { panel, root, handlers } = setup(); const store = checkStore();
 if (step !== 'safety') {
  store.startQuestions();
  for (const id of ['sender', 'request', 'verify']) {
   if (step === id) break;
   store.answer(id, 'unknown'); store.nextQuestion();
  }
 }
 const state = store.get();
 const find = text => [...root.querySelectorAll('button')].find(button => button.textContent === text);
 panel.render(state, {}); expect(find(STRINGS.checkNewSelection)).toBeUndefined();
 expect(find(STRINGS.insertNewSelection)).toBeUndefined();
 find(STRINGS.editCheckContent).click(); expect(handlers.onEditCheckContent).toHaveBeenCalledOnce();
 for (const pendingSelection of [{ text: '' }, { text: ' \u00a0 ' }, null]) {
  panel.render({ ...state, pendingSelection }, {}); expect(find(STRINGS.checkNewSelection)).toBeUndefined();
 }
 panel.render({ ...state, pendingSelection: { text: 'Explicitly captured replacement', truncated: false } }, {});
 expect(find(STRINGS.checkNewSelection)?.textContent).toBe('Sprawdź nowe zaznaczenie');
 expect(find(STRINGS.checkNewSelection)?.disabled).toBe(false); find(STRINGS.checkNewSelection).click();
 expect(handlers.onCheckNewSelection).toHaveBeenCalledOnce(); expect(handlers.onInsertSelection).not.toHaveBeenCalled();
 expect(handlers.onApprove).not.toHaveBeenCalled(); expect(find(STRINGS.insertNewSelection)).toBeUndefined();
});

for (const kind of ['edit', 'replacement']) test(`${kind} preview returns to checking instead of inserting a new selection`, () => {
 const { panel, root, handlers } = setup(); const store = checkStore(); store.editCheckContent();
 const find = text => [...root.querySelectorAll('button')].find(button => button.textContent === text);
 const state = { ...store.get(), candidateKind: kind, pendingSelection: { text: 'Other capture' } };
 panel.render(state, { host: 'demo.example' });
 expect(root.querySelector('textarea').value).toBe(store.get().check.case.content);
 expect(find(STRINGS.insertNewSelection)).toBeUndefined(); expect(find(STRINGS.checkNewSelection)).toBeUndefined();
 expect(find(STRINGS.cancelCheckEdit)?.disabled).toBe(false); find(STRINGS.cancelCheckEdit).click();
 expect(handlers.onCancelCheckEdit).toHaveBeenCalledOnce(); expect(handlers.onBack).not.toHaveBeenCalled();
 panel.render({ ...state, submitting: true }, { host: 'demo.example' });
 expect(find(STRINGS.cancelCheckEdit).disabled).toBe(true); expect(find(STRINGS.approve).disabled).toBe(true);
 expect(root.querySelector('textarea').readOnly).toBe(true);
});

test('unapproved preview retains its original insert-selection control without a check cancel button', () => {
 const { panel, root, handlers } = setup(); const store = createDraftStore();
 store.onAvatarClick({ text: 'Unapproved draft' }); store.onAvatarClick({ text: 'New selection' });
 panel.render(store.get(), { host: 'demo.example' });
 const find = text => [...root.querySelectorAll('button')].find(button => button.textContent === text);
 expect(find(STRINGS.cancelCheckEdit)).toBeUndefined(); expect(find(STRINGS.checkNewSelection)).toBeUndefined();
 find(STRINGS.insertNewSelection).click(); expect(handlers.onInsertSelection).toHaveBeenCalledOnce();
 expect(handlers.onCheckNewSelection).not.toHaveBeenCalled();
});
