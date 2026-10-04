import { normalizeText, capCodePoints, normalizeLink, extractFirstLink, isValidCase } from './case.js';
import { QUESTIONS, detectHints, evaluate } from './check.js';
export { detectHints, evaluate } from './check.js';

const ORDER = Object.keys(QUESTIONS);
const freezeAnswers = answers => Object.freeze(Object.fromEntries(Object.entries(answers).map(([id, values]) => [id, Object.freeze(values)])));
const checkView = step => ['safety', 'result', 'confirmation'].includes(step) ? step : 'question';
const initial = () => ({ view: 'closed', draft: null, candidateKind: null, check: null, pendingSelection: null, hidden: false, error: null, submitting: false, submissionKind: null, gen: 0, paste: { text: '', link: '' } });

export function createDraftStore() {
  let state = initial();
  const submitFailed = token => {
    if (!state.submitting || state.submissionKind !== 'case' || token !== state.gen) return false;
    state = { ...state, view: state.view === 'closed' ? 'closed' : 'preview', error: 'submit', submitting: false, submissionKind: null };
    return true;
  };
  return {
    get: () => state,
    onAvatarClick({ text, truncated }) {
      if (state.submitting) {
        state = { ...state, view: state.draft ? 'preview' : checkView(state.check.resumeStep) };
        return;
      }
      text = normalizeText(text);
      if (state.draft && state.candidateKind) state = { ...state, view: 'preview', pendingSelection: null };
      else if (state.draft) state = { ...state, view: 'preview', error: null,
        pendingSelection: text && text !== normalizeText(state.draft.text) ? { text, truncated: Boolean(truncated) } : null };
      else if (state.check) {
        const pendingSelection = text && text !== normalizeText(state.check.case.content) ? { text, truncated: Boolean(truncated) } : null;
        if (state.check.resumeStep === 'confirmation' && pendingSelection) {
          state = { ...state, view: 'preview', candidateKind: 'replacement', error: null,
            draft: { ...pendingSelection, link: extractFirstLink(text), origin: 'selection' }, pendingSelection: null };
        } else state = { ...state, view: checkView(state.check.resumeStep),
          error: ['guardianRequest', 'guardianRequestContextInvalidated'].includes(state.error) ? state.error : null, pendingSelection };
      }
      else if (text) state = { ...state, view: 'preview', draft: { text, link: extractFirstLink(text), origin: 'selection', truncated: Boolean(truncated) } };
      else state = { ...state, view: normalizeText(state.paste.text) || normalizeText(state.paste.link) ? 'paste' : 'menu' };
    },
    insertPendingSelection() {
      if (!state.pendingSelection || state.submitting || state.check) return;
      const p = state.pendingSelection;
      state = { ...state, view: 'preview', error: null, draft: { ...p, link: extractFirstLink(p.text), origin: 'selection' }, pendingSelection: null };
    },
    editPaste(patch) {
      if (state.submitting) return;
      const edits = {};
      for (const key of ['text', 'link']) if (Object.hasOwn(patch, key)) edits[key] = patch[key];
      state = { ...state, paste: { ...state.paste, ...edits } };
    },
    showPaste() { if (!state.submitting) state = { ...state, view: 'paste', error: null }; },
    showHowTo() { if (!state.submitting) state = { ...state, view: 'howto' }; },
    back() { if (!state.submitting) state = { ...state, view: 'menu', error: null }; },
    finishCheck() {
      if (state.submitting || state.view !== 'confirmation') return;
      state = { ...initial(), view: 'menu', hidden: state.hidden, gen: state.gen + 1 };
    },
    submitPaste({ text, link }) {
      if (state.submitting) return;
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
    editCheckContent() {
      if (!state.check || state.draft || state.submitting || !['safety', 'question', 'result', 'confirmation'].includes(state.view)) return;
      const c = state.check.case;
      state = { ...state, view: 'preview', candidateKind: 'edit', error: null,
        draft: { text: c.content, link: c.link, origin: c.origin, truncated: c.truncated } };
    },
    cancelCheckEdit() {
      if (!state.check || !state.candidateKind || state.submitting) return;
      state = { ...state, view: state.view === 'closed' ? 'closed' : checkView(state.check.resumeStep),
        draft: null, candidateKind: null, pendingSelection: null, error: null };
    },
    checkNewSelection() {
      if (!state.check || state.draft || !normalizeText(state.pendingSelection?.text) || state.submitting) return;
      const p = state.pendingSelection;
      state = { ...state, view: 'preview', candidateKind: 'replacement', error: null,
        draft: { ...p, link: extractFirstLink(p.text), origin: 'selection' }, pendingSelection: null };
    },
    close() { state = { ...state, view: 'closed', pendingSelection: null }; },
    beginSubmit() {
      if (state.submitting || !state.draft || !normalizeText(state.draft.text)) return null;
      state = { ...state, gen: state.gen + 1, submitting: true, submissionKind: 'case', error: null };
      return state.gen;
    },
    approved(token, approvedCase) {
      if (!state.submitting || state.submissionKind !== 'case' || token !== state.gen) return false;
      if (!isValidCase(approvedCase)) { submitFailed(token); return false; }
      const unchanged = state.check && normalizeText(state.check.case.content) === normalizeText(approvedCase.content)
        && normalizeLink(state.check.case.link) === normalizeLink(approvedCase.link);
      const check = unchanged ? state.check : Object.freeze({ case: Object.freeze(approvedCase), step: 'safety', resumeStep: 'safety',
        answers: freezeAnswers({ sender: [], request: [], verify: [] }), hints: detectHints(approvedCase), result: null,
        keptAnswers: Object.freeze({}), discrepancy: null });
      state = { ...state, view: state.view === 'closed' ? 'closed' : checkView(check.resumeStep), check,
        draft: null, candidateKind: null, pendingSelection: null, error: null, submitting: false, submissionKind: null };
      return true;
    },
    beginGuardianRequest() {
      if (state.view !== 'result' || !state.check?.result || state.draft || state.submitting) return null;
      state = { ...state, gen: state.gen + 1, submitting: true, submissionKind: 'guardian', error: null };
      return state.gen;
    },
    guardianRequested(token) {
      if (!state.submitting || state.submissionKind !== 'guardian' || token !== state.gen) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'confirmation',
        check: Object.freeze({ ...state.check, step: 'confirmation', resumeStep: 'confirmation' }),
        pendingSelection: null, error: null, submitting: false, submissionKind: null };
      return true;
    },
    guardianRequestFailed(token, contextInvalidated = false) {
      if (!state.submitting || state.submissionKind !== 'guardian' || token !== state.gen) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'result',
        error: contextInvalidated ? 'guardianRequestContextInvalidated' : 'guardianRequest', submitting: false, submissionKind: null };
      return true;
    },
    startQuestions() {
      if (state.submitting || !state.check || state.view !== 'safety') return;
      state = { ...state, view: 'question', error: null, check: Object.freeze({ ...state.check, step: 'sender', resumeStep: 'sender' }) };
    },
    answer(questionId, answerId) {
      if (state.submitting || !state.check || state.view !== 'question' || state.check.step !== questionId || !QUESTIONS[questionId]?.includes(answerId)) return;
      const previous = state.check.answers[questionId];
      let selected = [answerId];
      if (questionId === 'request' && !['unknown', 'ordinary'].includes(answerId)) {
        selected = previous.includes(answerId) ? previous.filter(id => id !== answerId)
          : [...previous.filter(id => !['unknown', 'ordinary'].includes(id)), answerId];
      } else if (questionId === 'request' && previous.includes(answerId)) selected = [];
      state = { ...state, error: null, check: Object.freeze({ ...state.check,
        answers: freezeAnswers({ ...state.check.answers, [questionId]: selected }), result: null,
        keptAnswers: Object.freeze({ ...state.check.keptAnswers, [questionId]: null }), discrepancy: null }) };
    },
    nextQuestion(keep = false) {
      if (state.submitting || !state.check || state.view !== 'question' || !state.check.answers[state.check.step]?.length) return;
      const check = state.check;
      const choice = check.answers[check.step];
      const mismatches = evaluate(check.answers, check.hints).mismatches.filter(m => m.questionId === check.step);
      if (mismatches.length && check.keptAnswers[check.step] !== choice && !(keep === true && check.discrepancy)) {
        state = { ...state, error: null, check: Object.freeze({ ...check, discrepancy: mismatches[0] }) };
        return;
      }
      const index = ORDER.indexOf(state.check.step);
      const step = ORDER[index + 1] ?? 'result';
      state = { ...state, view: checkView(step), error: null, check: Object.freeze({ ...state.check, step, resumeStep: step,
        discrepancy: null, keptAnswers: keep === true ? Object.freeze({ ...check.keptAnswers, [check.step]: choice }) : check.keptAnswers,
        result: step === 'result' ? evaluate(state.check.answers, state.check.hints) : null }) };
    },
    previousQuestion() {
      if (state.submitting || !state.check || state.view !== 'question') return;
      const step = ORDER[ORDER.indexOf(state.check.step) - 1] ?? 'safety';
      state = { ...state, view: checkView(step), error: null, check: Object.freeze({ ...state.check, step, resumeStep: step, discrepancy: null }) };
    },
    fixAnswers() {
      if (state.submitting || !state.check || state.view !== 'result') return;
      state = { ...state, view: 'question', error: null,
        check: Object.freeze({ ...state.check, step: 'sender', resumeStep: 'sender', result: null }) };
    },
    submitFailed,
    hide() { state = { ...state, hidden: true, view: 'closed', pendingSelection: null }; },
    show() { state = { ...state, hidden: false }; },
    resetForNewDocument() { state = { ...initial(), gen: state.gen + 1 }; },
  };
}
