import { normalizeText, extractFirstLink } from './case.js';

const OPTIONS = Object.freeze({
  sender: ['known_person', 'claims_organization', 'unknown_sender', 'unknown'],
  request: ['password', 'code', 'prize', 'payment', 'urgency', 'ordinary', 'unknown'],
  verify: ['independent_channel', 'message_link', 'no_channel', 'unknown'],
});
const freezeLists = lists => Object.freeze(Object.fromEntries(Object.entries(lists).map(([id, values]) => [id, Object.freeze(values)])));
const validLists = lists => Object.fromEntries(Object.entries(OPTIONS).map(([id, options]) =>
  [id, options.filter(option => Array.isArray(lists?.[id]) && lists[id].includes(option))]));
const matchingText = raw => normalizeText(typeof raw === 'string' ? raw : '').normalize('NFD').toLowerCase()
  .replace(/\p{M}/gu, '').replace(/\u0142/g, 'l').replace(/\s+/g, ' ');

// Exclude quoted reports or one unquoted clause, preserving later direct demands.
function withoutReports(text) {
  return text.replace(/\b(?:oszust napisal|zglaszam wiadomosc)\s*:\s*(?:\u201e[^\u201d]*\u201d|\u201c[^\u201d]*\u201d|"[^"]*"|'[^']*'|([^.!?;,]*))/g,
    (span, unquoted, offset) => {
      // A loss threat attached to an unquoted demand cannot be hidden by a report prefix.
      const after = text.slice(offset + span.length);
      if (unquoted !== undefined && /^\s*,\s*(?:inaczej|bo)\s+(?:stracisz|utracisz|zablokujemy)\b/.test(after)) return span;
      return ' ';
    });
}
function affirmative(text, pattern) {
  return [...text.matchAll(pattern)].some(match => !/\bnie\s+$/.test(text.slice(0, match.index)));
}

// Recognize narrow invitations and requests, never identity or message truth.
export function detectHints(caseOrDraft) {
  const raw = caseOrDraft?.content ?? caseOrDraft?.text;
  const text = withoutReports(matchingText(raw));
  const request = [];
  // Only explicit pronouns and a login conjunction may bridge the verb and credential.
  if (affirmative(text, /\b(?:podaj|wyslij|przeslij|wpisz|napisz)\s+(?:(?:mi|nam)\s+)?(?:(?:(?:swoj|twoj)\s+)?login\s+i\s+)?(?:(?:swoje|twoje)\s+)?hasl(?:o|a)\b/g)) request.push('password');
  if (affirmative(text, /\b(?:podaj|wyslij|przeslij|wpisz|napisz)\s+(?:(?:mi|nam)\s+)?(?:(?:swoj|twoj)\s+)?kod(?:u)?\s+(?:do\s+(?:konta|logowania)|(?:z\s+)?sms|logowania)\b/g)) request.push('code');
  const link = Boolean(extractFirstLink(text) || normalizeText(typeof caseOrDraft?.link === 'string' ? caseOrDraft.link : ''));
  const prize = affirmative(text, /\b(?:odbierz\s+(?:darmowa\s+)?nagrode|(?:kliknij|wejdz)[^.!?;]{0,80}\baby\s+odebrac\s+(?:darmowa\s+)?nagrode)\b/g);
  if (prize && link) request.push('prize');
  const payment = affirmative(text, /\b(?:zaplac\s+\S+|(?:zrob|wyslij|wykonaj)\s+przelew\b)/g);
  const action = payment || request.length || affirmative(text, /\b(?:kliknij|odpowiedz|zadzialaj|wejdz)\b/g);
  const urgency = action && (/\b(?:tylko dzis|natychmiast|ostatnia szansa)\b/.test(text)
    || /\b(?:inaczej|bo)\s+(?:stracisz|utracisz|zablokujemy)\b/.test(text)
    || (payment && /\bteraz\b/.test(text)));
  if (payment && urgency) request.push('payment');
  if (urgency) request.push('urgency');
  const sender = /\b(?:jestem|pisze)\s+z\s+(?:firmy|organizacji)\b/.test(text) ? ['claims_organization'] : [];
  return freezeLists({ sender, request, verify: link ? ['message_link'] : [] });
}

export function evaluate(answers, hints) {
  const choices = validLists(answers);
  const recognized = validLists(hints);
  const request = choices.request;
  const has = id => request.includes(id) || recognized.request.includes(id);
  const credentials = ['password', 'code'].filter(has);
  const pressure = has('payment') && has('urgency');
  const prizeLink = has('prize') && (choices.verify.includes('message_link') || recognized.verify.includes('message_link'));
  const signals = [...credentials.map(id => 'credential_' + id),
    ...(pressure ? ['payment_pressure'] : has('payment') ? ['payment'] : []),
    ...(prizeLink ? ['prize_link'] : has('prize') ? ['prize'] : []), ...(has('urgency') ? ['urgency'] : [])];
  const unknowns = [];
  if (!choices.sender.length || choices.sender.some(id => ['unknown', 'unknown_sender'].includes(id))) unknowns.push('sender');
  if (!request.length || request.includes('unknown')) {
    if (!recognized.request.some(id => id !== 'urgency')) unknowns.push('request');
    if (!has('urgency')) unknowns.push('urgency');
  }
  if (!choices.verify.includes('independent_channel')) unknowns.push('official_channel');
  const mismatches = ['password', 'code'].filter(id => recognized.request.includes(id) && request.length && !request.includes('unknown') && !request.includes(id))
    .map(id => Object.freeze({ questionId: 'request', answerId: id, messageKey: 'credential_' + id }));
  if (mismatches.length) unknowns.push('conflict');
  const stepId = credentials.length ? 'protect_credentials' : pressure ? 'verify_payment' : has('prize') ? 'verify_prize'
    : has('urgency') ? 'pause_and_verify' : has('payment') ? 'verify_payment' : 'independent_check';
  return Object.freeze({
    summaryKey: mismatches.length ? 'conflicting_answers' : signals.length ? 'caution' : unknowns.length ? 'insufficient_information' : 'no_signals',
    signals: Object.freeze(signals), unknowns: Object.freeze(unknowns),
    step: Object.freeze({ id: stepId, explanationKey: stepId + '_how' }), mismatches: Object.freeze(mismatches),
  });
}
