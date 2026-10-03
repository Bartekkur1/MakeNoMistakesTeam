import { normalizeText } from './case.js';

const freezeLists = lists => Object.freeze(Object.fromEntries(Object.entries(lists).map(([id, values]) => [id, Object.freeze(values)])));
const matchingText = raw => normalizeText(raw).normalize('NFD').toLowerCase()
  .replace(/\p{M}/gu, '').replace(/\u0142/g, 'l').replace(/\s+/g, ' ');

// Match requests, never the mere mention of a code or password.
export function detectHints(caseOrDraft) {
  const text = matchingText(caseOrDraft?.content ?? caseOrDraft?.text);
  const requests = text.split(/[.!?;\n]/).filter(part => !/\bnie\s+(?:podawaj|podaj|wysylaj|wyslij|przesylaj|przeslij)\b/.test(part)).join(' . ');
  const request = [];
  const command = '\\b(?:podaj|wyslij|przeslij)\\s+';
  if (new RegExp(command + '(?:swoje?\\s+)?hasl(?:o|a)\\b').test(requests)) request.push('password');
  if (new RegExp(command + '(?:swoj\\s+)?kod(?:u)?\\s+(?:do\\s+(?:konta|logowania)|(?:sms|logowania))\\b').test(requests)) request.push('code');
  if (/\b(?:zaplac|przelew)\b/.test(text)) request.push('payment');
  if (/\b(?:teraz|szybko|natychmiast)\b/.test(text)) request.push('urgency');
  return freezeLists({ sender: [], request, verify: [] });
}

export function evaluate(answers, hints) {
  const request = Array.isArray(answers?.request) ? answers.request : [];
  const recognized = Array.isArray(hints?.request) ? hints.request : [];
  const evidence = ['password', 'code', 'payment', 'urgency', 'prize'].filter(id => request.includes(id) || recognized.includes(id));
  const signals = evidence.map(id => id === 'password' || id === 'code' ? 'credential_' + id : id);
  const unknowns = ['sender', 'request', 'verify'].filter(id => !answers?.[id]?.length || answers[id].includes('unknown'));
  if (answers?.sender?.includes('unknown_sender') && !unknowns.includes('sender')) unknowns.push('sender');
  if (answers?.verify?.some(id => ['message_link', 'no_channel'].includes(id)) && !unknowns.includes('verify')) unknowns.push('verify');
  const mismatches = recognized.filter(id => ['password', 'code'].includes(id) && request.length && !request.includes('unknown') && !request.includes(id))
    .map(id => Object.freeze({ questionId: 'request', answerId: id, messageKey: 'credential_' + id }));
  if (mismatches.length) unknowns.push('conflict');
  const stepId = evidence.some(id => ['password', 'code'].includes(id)) ? 'protect_credentials'
    : evidence.includes('payment') ? 'verify_payment' : 'independent_check';
  return Object.freeze({
    summaryKey: mismatches.length ? 'conflicting_answers' : signals.length ? 'caution' : unknowns.length ? 'missing_information' : 'no_signal',
    signals: Object.freeze(signals), unknowns: Object.freeze(unknowns),
    step: Object.freeze({ id: stepId, explanationKey: stepId + '_how' }),
    mismatches: Object.freeze(mismatches),
  });
}
