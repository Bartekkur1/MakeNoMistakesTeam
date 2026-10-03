import { test, expect, vi, afterEach } from 'vitest';
import * as panelModule from '../../src/ui/panel.js';
import { createDraftStore } from '../../src/core/draft.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
import { buildCase } from '../../src/core/case.js';
const hosts = [];
afterEach(() => { for (const host of hosts.splice(0)) host.remove(); });
const setup = () => { const host = document.createElement('div'); document.body.append(host); hosts.push(host); const root=host.attachShadow({mode:'open'}); const handlers=Object.fromEntries(['onClose','onCheck','onHowTo','onBack','onPasteEdit','onPasteNext','onSafetyNext','onAnswer','onQuestionNext','onQuestionBack','onFixAnswers'].map(k=>[k,vi.fn()])); return {root,handlers,panel:panelModule.createPanel({root,strings:STRINGS,handlers})}; };
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
