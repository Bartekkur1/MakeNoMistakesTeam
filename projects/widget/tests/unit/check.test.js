import { test, expect } from 'vitest';
import { detectHints, evaluate } from '../../src/core/check.js';
import { buildCase, capCodePoints, MAX_CONTENT } from '../../src/core/case.js';
import { STRINGS } from '../../src/ui/strings.pl.js';

const honest = { sender: ['known_person'], request: ['ordinary'], verify: ['independent_channel'] };
const unknown = { sender: ['unknown'], request: ['unknown'], verify: ['unknown'] };
const result = (summaryKey, signals, unknowns, stepId, mismatches = []) => ({
  summaryKey, signals, unknowns, step: { id: stepId, explanationKey: stepId + '_how' }, mismatches,
});
const fixtures = [
  ['account code', 'Podaj kod do konta, aby odebrać nagrodę', '',
    { sender: ['unknown_sender'], request: ['code'], verify: ['no_channel'] },
    ['code'], result('caution', ['credential_code'], ['sender', 'official_channel'], 'protect_credentials')],
  ['prize with link', 'Odbierz darmową nagrodę: https://nagroda.example/prezent', '',
    { sender: ['claims_organization'], request: ['prize'], verify: ['message_link'] },
    ['prize'], result('caution', ['prize_link'], ['official_channel'], 'verify_prize')],
  ['payment pressure', 'Zapłać natychmiast, inaczej stracisz konto.', '',
    { sender: ['unknown_sender'], request: ['payment', 'urgency'], verify: ['no_channel'] },
    ['payment', 'urgency'], result('caution', ['payment_pressure', 'urgency'], ['sender', 'official_channel'], 'verify_payment')],
  ['honest invitation', 'Dziś gramy o 17, spotkajmy się w naszej grupie', '', honest,
    [], result('no_signals', [], [], 'independent_check')],
  ['ambiguous message', 'Zobacz to', '', unknown,
    [], result('insufficient_information', [], ['sender', 'request', 'urgency', 'official_channel'], 'independent_check')],
];

test('recognizes prize with a link and chooses explained prize verification', () => {
  const [, text, link, answers, requests, expected] = fixtures[1];
  const hints = detectHints({ content: text, link });
  expect(hints.request).toEqual(requests);
  expect(hints.verify).toEqual(['message_link']);
  expect(evaluate(answers, hints)).toEqual(expected);
});

for (const [name, text, link, answers, requests, expected] of fixtures) {
  test(`D-14 ${name} has exact evidence, unknowns and one priority action`, () => {
    const hints = detectHints({ content: text, link });
    expect(hints.request).toEqual(requests);
    expect(evaluate(answers, hints)).toEqual(expected);
  });
}

const negatives = [
  'Dziś gramy', 'Mam kod pocztowy', 'Podaj kod pocztowy', 'Prześlij kod źródłowy',
  'Nie podawaj hasła ani kodu', 'Nie podaj hasła do konta',
  'Zapłać za obiad, gdy będziesz mieć czas', 'Przypominam o przelewie za obiad',
  'Wygrałem nagrodę na szkolnym konkursie', 'Odbierz darmową nagrodę',
  'Tutaj jest plan zajęć: https://szkola.example/plan',
  'dziś', 'dzis', 'kod', 'nagroda', 'zaplac', 'https://szkola.example', '😀🎁🔑',
  'podajhaslo do konta', 'Podaj kod do kontaminacji', 'Dzisiaj jest konkurs',
];
for (const text of negatives) test(`honest negative has no automatic warning: ${text}`, () => {
  const hints = detectHints({ text });
  expect(hints.request).toEqual([]);
  const out = evaluate(honest, hints);
  expect(out).toEqual(result('no_signals', [], [], 'independent_check'));
});

const reports = [
  'Oszust napisał: „podaj kod do konta”',
  'Zgłaszam wiadomość: podaj hasło do konta',
  'Oszust napisał: "podaj kod do konta"',
  "Oszust napisał: 'podaj hasło do konta'",
];
for (const text of reports) {
  test(`reported request does not accuse its honest reporter: ${text}`, () => {
    const hints = detectHints({ text });
    expect(hints.request).toEqual([]);
    expect(evaluate(honest, hints)).toEqual(result('no_signals', [], [], 'independent_check'));
    for (const id of ['code', 'password']) {
      expect(evaluate({ ...honest, request: [id] }, hints)).toEqual(result('caution', ['credential_' + id], [], 'protect_credentials'));
    }
  });
}
for (const text of [
  'Oszust napisał: „podaj kod do konta”. Prześlij hasło do konta.',
  'Oszust napisał: "podaj kod do konta". Prześlij hasło do konta.',
  'Zgłaszam wiadomość: podaj hasło do konta. Wyślij kod do konta.',
  'Nie podawaj hasła. Wyślij kod do konta.',
]) test(`a separate direct demand survives reporting or caution: ${text}`, () => {
  const id = text.includes('Prześlij') ? 'password' : 'code';
  const hints = detectHints({ text });
  expect(hints.request).toEqual([id]);
  expect(evaluate({ ...honest, request: [id] }, hints).signals).toEqual(['credential_' + id]);
});

for (const text of ['Zapłać teraz', 'Zrób przelew, to ostatnia szansa', 'Zapłać do 17, inaczej stracisz konto']) {
  test(`payment requires action-linked pressure: ${text}`, () => {
    const hints = detectHints({ text });
    expect(hints.request).toEqual(['payment', 'urgency']);
    expect(evaluate({ ...honest, request: ['payment', 'urgency'] }, hints)).toEqual(result('caution', ['payment_pressure', 'urgency'], [], 'verify_payment'));
  });
}
test('a standalone payment answer calls for verification without an accusation', () => {
  expect(evaluate({ ...honest, request: ['payment'] }, null)).toEqual(result('caution', ['payment'], [], 'verify_payment'));
});
for (const verify of ['independent_channel', 'no_channel']) test(`a child-reported prize without a link remains visible: ${verify}`, () => {
  expect(evaluate({ ...honest, request: ['prize'], verify: [verify] }, detectHints({ text: 'Zobacz to' })))
    .toEqual(result('caution', ['prize'], verify === 'no_channel' ? ['official_channel'] : [], 'verify_prize'));
});
for (const [text, signals, unknowns, step] of [
  ['Kliknij, tylko dziś', ['urgency'], ['request'], 'pause_and_verify'],
  ['Podaj kod do konta', ['credential_code'], ['urgency'], 'protect_credentials'],
  ['Prześlij hasło do konta natychmiast', ['credential_password', 'urgency'], [], 'protect_credentials'],
]) test(`unknown request does not contradict recognized evidence: ${text}`, () => {
  expect(evaluate({ ...honest, request: ['unknown'] }, detectHints({ text })))
    .toEqual(result('caution', signals, unknowns, step));
});
test('urgency phrases select a pause rather than a bare-date alarm', () => {
  for (const text of ['Kliknij, tylko dziś', 'Zadziałaj natychmiast', 'Ostatnia szansa, odpowiedz']) {
    const hints = detectHints({ text });
    expect(hints.request).toEqual(['urgency']);
    expect(evaluate({ ...honest, request: ['urgency'] }, hints)).toEqual(result('caution', ['urgency'], [], 'pause_and_verify'));
  }
});
test('an explicitly supplied link combines with a prize invitation without certifying its hostname', () => {
  const hints = detectHints({ text: 'Odbierz darmową nagrodę', link: 'https://oficjalna.example/gift' });
  expect(hints).toEqual({ sender: [], request: ['prize'], verify: ['message_link'] });
  expect(evaluate({ ...honest, request: ['prize'] }, hints).signals).toEqual(['prize_link']);
  expect(detectHints({ text: 'Marka Oficjalna', link: 'https://oficjalna.example' }).sender).toEqual([]);
  expect(detectHints({ text: 'Jestem z firmy Oficjalna' }).sender).toEqual(['claims_organization']);
});
test('unknown sender and a message-only channel are missing facts, never fraud evidence', () => {
  expect(evaluate({ sender: ['unknown_sender'], request: ['ordinary'], verify: ['message_link'] }, detectHints({ text: 'Plan zajęć', link: 'https://szkola.example' })))
    .toEqual(result('insufficient_information', [], ['sender', 'official_channel'], 'independent_check'));
});
test('retaining or correcting a credential contradiction never erases evidence', () => {
  const hints = detectHints({ text: 'Podaj kod do konta' });
  expect(evaluate(honest, hints)).toEqual(result('conflicting_answers', ['credential_code'], ['conflict'], 'protect_credentials',
    [{ questionId: 'request', answerId: 'code', messageKey: 'credential_code' }]));
  expect(evaluate({ ...honest, request: ['code'] }, hints)).toEqual(result('caution', ['credential_code'], [], 'protect_credentials'));
  expect(evaluate({ ...honest, request: ['unknown'] }, hints).mismatches).toEqual([]);
});

for (const value of [null, undefined, {}, { text: '' }, { content: ' \t\u00a0\n' }]) {
  test(`empty detection is defensive: ${JSON.stringify(value)}`, () => {
    expect(detectHints(value)).toEqual({ sender: [], request: [], verify: [] });
  });
}
for (const [name, answers, hints] of [
  ['null', null, null], ['empty objects', {}, {}], ['empty arrays', [], []],
  ['empty dimensions', { sender: [], request: [], verify: [] }, { request: [] }],
  ['all unknown', unknown, null],
  ['malformed IDs', { sender: ['verified', null], request: ['credential_code', {}, 'bogus'], verify: ['official'] }, { request: ['bogus'] }],
  ['malformed dimensions', { sender: 'known_person', request: {}, verify: 7 }, { request: 'code' }],
]) test(`insufficient data never throws or invents an alarm: ${name}`, () => {
  expect(evaluate(answers, hints)).toEqual(result('insufficient_information', [], ['sender', 'request', 'urgency', 'official_channel'], 'independent_check'));
});
test('one unknown answer has only its corresponding missing fact', () => {
  expect(evaluate({ ...honest, sender: ['unknown'] }, null)).toEqual(result('insufficient_information', [], ['sender'], 'independent_check'));
});

for (const [original, plain, id] of [
  ['Prześlij hasło do konta', 'Przeslij haslo do konta', 'password'],
  ['Wyślij kod do konta', 'Wyslij kod do konta', 'code'],
]) test(`NFC/NFD, case, accents and NBSP preserve credential recognition: ${id}`, () => {
  for (const text of [original, plain, original.normalize('NFD'), original.toUpperCase(), plain.toUpperCase(), original.replaceAll(' ', '\u00a0'), original.normalize('NFD').toUpperCase().replaceAll(' ', '\u00a0')]) {
    expect(detectHints({ content: text })).toEqual({ sender: [], request: [id], verify: [] });
  }
});
test('matching never mutates approved content and code-point limits stay unchanged', () => {
  const c = buildCase({ text: '  Wyślij\u00a0kod do konta  ', origin: 'paste', link: '' });
  const before = { ...c };
  expect(c.content).toBe('Wyślij kod do konta');
  detectHints(c); expect(c).toEqual(before);
  const capped = capCodePoints('😀'.repeat(MAX_CONTENT) + 'Podaj kod do konta');
  expect(Array.from(capped.text)).toHaveLength(MAX_CONTENT); expect(capped.truncated).toBe(true);
  expect(detectHints({ text: capped.text }).request).toEqual([]);
});
test('deduplication, stable priority and deep freezing do not mutate answer or hint arrays', () => {
  const answers = { sender: ['known_person'], request: ['urgency', 'prize', 'payment', 'code', 'password', 'code'], verify: ['message_link'] };
  const hints = { sender: [], request: ['code', 'urgency', 'code'], verify: ['message_link'] };
  const before = structuredClone({ answers, hints });
  const out = evaluate(answers, hints);
  expect(out).toEqual(result('caution', ['credential_password', 'credential_code', 'payment_pressure', 'prize_link', 'urgency'], ['official_channel'], 'protect_credentials'));
  expect({ answers, hints }).toEqual(before);
  expect(evaluate({ ...answers, request: [...answers.request].reverse() }, hints)).toEqual(out);
  for (const value of [out, out.signals, out.unknowns, out.step, out.mismatches, detectHints({ text: 'Podaj kod do konta' }).request]) expect(Object.isFrozen(value)).toBe(true);
  const conflict = evaluate(honest, detectHints({ text: 'Podaj kod do konta' }));
  expect(Object.isFrozen(conflict.mismatches[0])).toBe(true);
});
test('each priority tier selects exactly one explained action', () => {
  for (const [request, verify, id] of [
    [['code', 'payment', 'urgency', 'prize'], ['message_link'], 'protect_credentials'],
    [['payment', 'urgency', 'prize'], ['message_link'], 'verify_payment'],
    [['prize', 'urgency'], ['message_link'], 'verify_prize'],
    [['urgency'], ['independent_channel'], 'pause_and_verify'],
    [['ordinary'], ['independent_channel'], 'independent_check'],
  ]) {
    const out = evaluate({ ...honest, request, verify }, null);
    expect(out.step).toEqual({ id, explanationKey: id + '_how' });
  }
});
test('the working pack resolves canonical keys to Polish reasons and instructions', () => {
  expect(STRINGS.hintBadge).toBe('Podpowiedź z wiadomości');
  for (const key of ['no_signals', 'caution', 'insufficient_information', 'conflicting_answers']) expect(STRINGS.checkSummaries[key]).toBeTruthy();
  for (const key of ['credential_code', 'credential_password', 'prize_link', 'payment_pressure', 'urgency']) expect(STRINGS.checkSignals[key]).toBeTruthy();
  for (const key of ['sender', 'request', 'urgency', 'official_channel', 'conflict']) expect(STRINGS.checkUnknowns[key]).toBeTruthy();
  for (const key of ['protect_credentials', 'verify_payment', 'verify_prize', 'pause_and_verify', 'independent_check']) {
    expect(STRINGS.checkSteps[key]).toBeTruthy(); expect(STRINGS.checkSteps[key + '_how']).toBeTruthy();
  }
  expect(STRINGS.checkSummaries.no_signals).toBe('Nie widzę typowych sygnałów oszustwa. To nie daje pewności — sprawdź wiadomość oficjalnym kanałem.');
});
