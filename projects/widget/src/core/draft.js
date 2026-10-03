import { normalizeText, capCodePoints, normalizeLink, extractFirstLink, isValidCase } from './case.js';
import { detectHints, evaluate } from './check.js';
export { detectHints, evaluate } from './check.js';

const QUESTIONS = Object.freeze({
  sender: ['known_person', 'claims_organization', 'unknown_sender', 'unknown'],
  request: ['password', 'code', 'prize', 'payment', 'urgency', 'ordinary', 'unknown'],
  verify: ['independent_channel', 'message_link', 'no_channel', 'unknown'],
});
const ORDER = Object.keys(QUESTIONS);
const freezeAnswers = answers => Object.freeze(Object.fromEntries(Object.entries(answers).map(([id, values]) => [id, Object.freeze(values)])));
const initial = () => ({ view: 'closed', draft: null, check: null, pendingSelection: null, hidden: false, error: null, submitting: false, gen: 0, paste: { text: '', link: '' } });

export function createDraftStore() {
  let state = initial();
  return {
    get: () => state,
    onAvatarClick({ text, truncated }) {
      text = normalizeText(text);
      if (state.draft) state = { ...state, view: 'preview', error: null,
        pendingSelection: text && text !== normalizeText(state.draft.text) ? { text, truncated: Boolean(truncated) } : null };
      else if (text) state = { ...state, view: 'preview', draft: { text, link: extractFirstLink(text), origin: 'selection', truncated: Boolean(truncated) } };
      else state = { ...state, view: normalizeText(state.paste.text) || normalizeText(state.paste.link) ? 'paste' : 'menu' };
    },
    insertPendingSelection() {
      if (!state.pendingSelection || state.submitting) return;
      const p = state.pendingSelection;
      state = { ...state, view: 'preview', error: null, draft: { ...p, link: extractFirstLink(p.text), origin: 'selection' }, pendingSelection: null };
    },
    editPaste(patch) {
      const edits = {};
      for (const key of ['text', 'link']) if (Object.hasOwn(patch, key)) edits[key] = patch[key];
      state = { ...state, paste: { ...state.paste, ...edits } };
    },
    showPaste() { state = { ...state, view: 'paste', error: null }; },
    showHowTo() { state = { ...state, view: 'howto' }; },
    back() { state = { ...state, view: 'menu', error: null }; },
    submitPaste({ text, link }) {
      const norm = normalizeText(text);
      if (!norm) { state = { ...state, view: 'paste', error: 'empty' }; return; }
      const capped = capCodePoints(norm);
      state = { ...state, view: 'preview', error: null, draft: { ...capped, link: normalizeLink(link), origin: 'paste' }, paste: { text: '', link: '' } };
    },
    edit(patch) {
      if (state.submitting) return;
      const edits = {};
      for (const key of ['text', 'link']) if (Object.hasOwn(patch, key)) edits[key] = patch[key];
      state = { ...state, draft: state.draft ? { ...state.draft, ...edits } : null };
    },
    close() { state = { ...state, view: 'closed', pendingSelection: null }; },
    beginSubmit() {
      if (state.submitting || !state.draft) return null;
      state = { ...state, gen: state.gen + 1, submitting: true, error: null };
      return state.gen;
    },
    approved(token, approvedCase) {
      if (!state.submitting || token !== state.gen || !isValidCase(approvedCase)) return false;
      const check = Object.freeze({ case: Object.freeze(approvedCase), step: 'safety',
        answers: freezeAnswers({ sender: [], request: [], verify: [] }), hints: detectHints(approvedCase), result: null,
        keptAnswers: Object.freeze({}), discrepancy: null });
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'safety', check, draft: null, pendingSelection: null, error: null, submitting: false };
      return true;
    },
    startQuestions() {
      if (!state.check || state.view !== 'safety') return;
      state = { ...state, view: 'question', check: Object.freeze({ ...state.check, step: 'sender' }) };
    },
    answer(questionId, answerId) {
      if (!state.check || state.view !== 'question' || state.check.step !== questionId || !QUESTIONS[questionId]?.includes(answerId)) return;
      const previous = state.check.answers[questionId];
      let selected = [answerId];
      if (questionId === 'request' && !['unknown', 'ordinary'].includes(answerId)) {
        selected = previous.includes(answerId) ? previous.filter(id => id !== answerId)
          : [...previous.filter(id => !['unknown', 'ordinary'].includes(id)), answerId];
      } else if (questionId === 'request' && previous.includes(answerId)) selected = [];
      state = { ...state, check: Object.freeze({ ...state.check,
        answers: freezeAnswers({ ...state.check.answers, [questionId]: selected }), result: null,
        keptAnswers: Object.freeze({ ...state.check.keptAnswers, [questionId]: null }), discrepancy: null }) };
    },
    nextQuestion(keep = false) {
      if (!state.check || state.view !== 'question' || !state.check.answers[state.check.step]?.length) return;
      const check = state.check;
      const choice = check.answers[check.step];
      const mismatches = evaluate(check.answers, check.hints).mismatches.filter(m => m.questionId === check.step);
      if (mismatches.length && check.keptAnswers[check.step] !== choice && !(keep === true && check.discrepancy)) {
        state = { ...state, check: Object.freeze({ ...check, discrepancy: mismatches[0] }) };
        return;
      }
      const index = ORDER.indexOf(state.check.step);
      const step = ORDER[index + 1] ?? 'result';
      state = { ...state, view: step === 'result' ? 'result' : 'question', check: Object.freeze({ ...state.check, step,
        discrepancy: null, keptAnswers: keep === true ? Object.freeze({ ...check.keptAnswers, [check.step]: choice }) : check.keptAnswers,
        result: step === 'result' ? evaluate(state.check.answers, state.check.hints) : null }) };
    },
    previousQuestion() {
      if (!state.check || state.view !== 'question') return;
      const step = ORDER[ORDER.indexOf(state.check.step) - 1] ?? 'safety';
      state = { ...state, view: step === 'safety' ? 'safety' : 'question', check: Object.freeze({ ...state.check, step, discrepancy: null }) };
    },
    fixAnswers() {
      if (!state.check || state.view !== 'result') return;
      state = { ...state, view: 'question', check: Object.freeze({ ...state.check, step: 'sender' }) };
    },
    submitFailed(token) {
      if (!state.submitting || token !== state.gen) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'preview', error: 'submit', submitting: false };
      return true;
    },
    hide() { state = { ...state, hidden: true, view: 'closed', pendingSelection: null }; },
    show() { state = { ...state, hidden: false }; },
    resetForNewDocument() { state = { ...initial(), gen: state.gen + 1 }; },
  };
}
