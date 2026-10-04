import { normalizeText, capCodePoints, normalizeLink, extractFirstLink, isValidCase, proposeAttackType, sourceFromCase, buildReportPayload } from './case.js';
import { QUESTIONS, detectHints, evaluate } from './check.js';
export { detectHints, evaluate } from './check.js';

import { ATTACK_TYPES, ACTIONS_BY_ATTACK_TYPE, REPORT_SOURCES, REPORT_FIELDS, REPORT_STATES } from '../../../web-app/src/lib/contract/types.ts';

const ORDER = Object.keys(QUESTIONS);
const freezeAnswers = answers => Object.freeze(Object.fromEntries(Object.entries(answers).map(([id, values]) => [id, Object.freeze(values)])));
const checkView = step => ['safety', 'result', 'confirmation', 'sendPreview', 'myReports', 'platformHowTo'].includes(step) ? step : 'question';
// D-14: list rows live only in this transient tab state; every open/retry fetches anew.
const noReports = (returnView = 'menu') => Object.freeze({ request_id: null, returnView, loading: false, items: null,
  error: null, account_id: null, revision: null });
const initial = () => ({ view: 'closed', draft: null, candidateKind: null, check: null, pendingSelection: null, hidden: false, error: null, submitting: false, submissionKind: null, gen: 0, case_id: null, request_id: null, sendGeneration: 0, sendOperation: null, sendPreview: null, sendOutcome: null, sentReport: null, reportSource: null, sessionStatus: Object.freeze({ status: 'unknown', account: null, revision: null }), reports: noReports(), paste: { text: '', link: '' } });

export function createDraftStore() {
  let state = initial();
  const currentSend = token => token === state.sendOperation && token?.generation === state.sendGeneration
    && token.case_id === state.case_id && state.submitting && state.submissionKind === 'report';
  // Only the current list-open request may replace rows; close, back, reset and account changes drop it.
  const reportsCurrent = token => state.view === 'myReports' && state.reports.loading && Boolean(token?.request_id)
    && state.reports.request_id === token.request_id;
  const setResume = step => Object.freeze({ ...state.check, resumeStep: step });
  const replaceSelection = patch => {
    if (state.view !== 'sendPreview' || state.submitting || state.sentReport || !state.sendPreview) return false;
    try {
      const payload = buildReportPayload(state.check.case, { ...state.sendPreview, ...patch });
      state = { ...state, sendPreview: Object.freeze({ ...state.sendPreview, ...payload }) };
      return true;
    } catch { return false; }
  };
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
          error: null, pendingSelection };
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
      if (state.submitting || !state.sentReport || !['confirmation', 'result'].includes(state.view)) return;
      state = { ...initial(), view: 'menu', hidden: state.hidden, gen: state.gen + 1, sendGeneration: state.sendGeneration + 1 };
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
      if (!state.check || state.draft || state.submitting || !['safety', 'question', 'result'].includes(state.view)) return;
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
    close() { state = { ...state, view: 'closed', pendingSelection: null, reports: noReports(state.reports.returnView) }; },
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
      const reportState = unchanged ? {} : { case_id: globalThis.crypto.randomUUID(), request_id: null,
        sendGeneration: state.sendGeneration + 1, sendOperation: null, sendPreview: null, sendOutcome: null, sentReport: null, reportSource: null };
      state = { ...state, ...reportState, view: state.view === 'closed' ? 'closed' : checkView(check.resumeStep), check,
        draft: null, candidateKind: null, pendingSelection: null, error: null, submitting: false, submissionKind: null };
      return true;
    },
    setSessionStatus(metadata) {
      if (!['unknown', 'none', 'connected'].includes(metadata?.status)
        || (metadata.status === 'connected' && (!metadata.account?.id || !metadata.account?.display_name || !Number.isInteger(metadata.revision)))) return false;
      const sessionStatus = Object.freeze({ status: metadata.status,
        account: metadata.status === 'connected' ? Object.freeze({ ...metadata.account }) : null, revision: metadata.revision ?? null });
      let sendPreview = state.sendPreview;
      // An active operation keeps its reviewed recipient snapshot even if another account logs in.
      if (sendPreview && !state.submitting && !state.sentReport && sessionStatus.status === 'connected') {
        sendPreview = Object.freeze({ ...sendPreview, recipient: sessionStatus.account, session_revision: sessionStatus.revision });
      }
      state = { ...state, sessionStatus, sendPreview,
        sendOutcome: !state.submitting && sessionStatus.status === 'connected' && state.sendOutcome?.kind === 'no-account' ? null : state.sendOutcome };
      return true;
    },
    openSendPreview(session = state.sessionStatus) {
      if (!state.check?.result || state.draft || state.submitting || !isValidCase(state.check.case)) return false;
      if (state.sentReport) {
        state = { ...state, view: 'confirmation', check: setResume('confirmation') };
        return true;
      }
      if (session?.status !== 'connected' || !session.account?.id || !Number.isInteger(session.revision)) return false;
      let sendPreview = state.sendPreview;
      if (!sendPreview) {
        const proposal = proposeAttackType(state.check.answers, state.check.result);
        try {
          sendPreview = Object.freeze({ ...buildReportPayload(state.check.case,
            { attack_type: proposal, taken_actions: [], source: state.reportSource ?? sourceFromCase(state.check.case) }),
            proposal, recipient: Object.freeze({ ...session.account }), session_revision: session.revision });
        } catch { return false; }
      } else sendPreview = Object.freeze({ ...sendPreview, recipient: Object.freeze({ ...session.account }), session_revision: session.revision });
      state = { ...state, view: 'sendPreview', sendPreview, reportSource: sendPreview.source, check: setResume('sendPreview'), pendingSelection: null };
      return true;
    },
    // D-15: local platform guidance. It shares the case-bound source with the send preview,
    // never sends anything and never changes the current check.
    openPlatformHowTo() {
      if (state.view !== 'result' || !state.check?.result || state.draft || state.submitting || state.sentReport
        || !isValidCase(state.check.case)) return false;
      const reportSource = state.sendPreview?.source ?? state.reportSource ?? sourceFromCase(state.check.case);
      state = { ...state, view: 'platformHowTo', reportSource, check: setResume('platformHowTo'), pendingSelection: null };
      return true;
    },
    setPlatformSource(value) {
      if (state.view !== 'platformHowTo' || !REPORT_SOURCES.includes(value) || state.submitting || !state.check) return false;
      let sendPreview = state.sendPreview;
      if (sendPreview && !state.sentReport) {
        try { sendPreview = Object.freeze({ ...sendPreview, ...buildReportPayload(state.check.case, { ...sendPreview, source: value }) }); }
        catch { return false; }
      }
      state = { ...state, reportSource: value, sendPreview };
      return true;
    },
    backFromPlatformHowTo() {
      if (state.view !== 'platformHowTo' || !state.check?.result || state.submitting) return false;
      state = { ...state, view: 'result', check: setResume('result') };
      return true;
    },
    setSendAttackType(value) {
      if (!ATTACK_TYPES.includes(value) || !state.sendPreview) return false;
      return replaceSelection({ attack_type: value,
        taken_actions: state.sendPreview.taken_actions.filter(action => ACTIONS_BY_ATTACK_TYPE[value].includes(action)) });
    },
    toggleSendAction(value) {
      if (!state.sendPreview || !ACTIONS_BY_ATTACK_TYPE[state.sendPreview.attack_type].includes(value)) return false;
      const selected = state.sendPreview.taken_actions;
      return replaceSelection({ taken_actions: selected.includes(value) ? selected.filter(action => action !== value) : [...selected, value] });
    },
    setReportSource(value) {
      if (!REPORT_SOURCES.includes(value) || !replaceSelection({ source: value })) return false;
      state = { ...state, reportSource: value };
      return true;
    },
    backFromSendPreview() {
      if (state.submitting || !state.check || state.view !== 'sendPreview') return false;
      const view = state.sentReport ? 'confirmation' : 'result';
      state = { ...state, view, check: setResume(view) };
      return true;
    },
    // Opened from the menu or from the unknown-delivery warning. Viewing the list never marks a
    // case as sent and never resends; the warning preview keeps its payload, controls and outcome.
    openMyReports(returnView = state.view === 'sendPreview' ? 'sendPreview' : 'menu') {
      if (state.submitting || !['menu', 'sendPreview'].includes(state.view) || !['menu', 'sendPreview'].includes(returnView)
        || (returnView === 'sendPreview' && (!state.check || !state.sendPreview))) return false;
      state = { ...state, view: 'myReports', reports: Object.freeze({ ...noReports(returnView), loading: true }),
        check: returnView === 'sendPreview' ? setResume('myReports') : state.check };
      return true;
    },
    beginReportsLoad() {
      if (state.view !== 'myReports') return null;
      const token = Object.freeze({ request_id: globalThis.crypto.randomUUID() });
      // A retry replaces the list: old rows are dropped before the new reply arrives.
      state = { ...state, reports: Object.freeze({ ...noReports(state.reports.returnView), request_id: token.request_id, loading: true }) };
      return token;
    },
    reportsCurrent,
    reportsLoaded(token, response) {
      if (!reportsCurrent(token) || response?.ok !== true || !Array.isArray(response.reports) || response.reports.length > 10
        || state.sessionStatus.status !== 'connected' || response.account_id !== state.sessionStatus.account.id
        || response.revision !== state.sessionStatus.revision
        || !response.reports.every(row => row !== null && typeof row === 'object' && REPORT_FIELDS.every(key => Object.hasOwn(row, key))
          && REPORT_STATES.includes(row.state) && ATTACK_TYPES.includes(row.attack_type) && typeof row.content === 'string'
          && Number.isFinite(Date.parse(row.created_at)))) return false;
      // Server order (created_at desc, id desc) is kept exactly; nothing is merged or resorted.
      const items = Object.freeze(response.reports.map(row => Object.freeze({ ...row, taken_actions: Object.freeze([...row.taken_actions]) })));
      state = { ...state, reports: Object.freeze({ ...state.reports, loading: false, items, error: null,
        account_id: response.account_id, revision: response.revision }) };
      return true;
    },
    reportsFailed(token, outcome) {
      if (!reportsCurrent(token)) return false;
      state = { ...state, reports: Object.freeze({ ...state.reports, loading: false, items: null,
        error: outcome?.kind === 'no-account' ? 'no-account' : 'failed' }) };
      return true;
    },
    // Account/session change: old rows are cleared before anything else is shown.
    clearReports() {
      state = { ...state, reports: Object.freeze({ ...noReports(state.reports.returnView), loading: state.view === 'myReports' }) };
    },
    backFromReports() {
      if (state.view !== 'myReports' || state.submitting) return false;
      const returnView = state.reports.returnView === 'sendPreview' && state.check && state.sendPreview ? 'sendPreview' : 'menu';
      state = { ...state, view: returnView, reports: noReports(), check: returnView === 'sendPreview' ? setResume('sendPreview') : state.check };
      return true;
    },
    beginReportSend() {
      if (state.view !== 'sendPreview' || !state.check?.result || state.draft || state.submitting || state.sentReport
        || !state.sendPreview || state.sessionStatus.status !== 'connected'
        || state.sessionStatus.account.id !== state.sendPreview.recipient.id
        || state.sessionStatus.revision !== state.sendPreview.session_revision) return null;
      let payload;
      try { payload = buildReportPayload(state.check.case, state.sendPreview); } catch { return null; }
      const token = Object.freeze({ generation: state.sendGeneration + 1, case_id: state.case_id,
        request_id: globalThis.crypto.randomUUID(), expected_account_id: state.sendPreview.recipient.id,
        session_revision: state.sendPreview.session_revision, recipient: state.sendPreview.recipient, payload });
      state = { ...state, sendGeneration: token.generation, request_id: token.request_id, sendOperation: token,
        submitting: true, submissionKind: 'report', sendOutcome: null };
      return token;
    },
    reportSent(token, response) {
      if (!currentSend(token)) return false;
      const report = response?.report;
      const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
      if (response?.ok !== true || response.recipient?.id !== token.expected_account_id || !report
        || Reflect.ownKeys(report).length !== REPORT_FIELDS.length || !REPORT_FIELDS.every(key => Object.hasOwn(report, key))
        || !uuid(report.id) || !uuid(report.child_id) || report.parent_id !== token.expected_account_id
        || report.state !== 'pending_parent' || !date(report.created_at) || !date(report.updated_at)
        || Date.parse(report.updated_at) < Date.parse(report.created_at)
        || !['content', 'source', 'attack_type'].every(key => report[key] === token.payload[key])
        || !Array.isArray(report.taken_actions) || report.taken_actions.length !== token.payload.taken_actions.length
        || !report.taken_actions.every((action, i) => action === token.payload.taken_actions[i])) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'confirmation',
        check: setResume('confirmation'), sentReport: Object.freeze({ report: Object.freeze({ ...report,
          taken_actions: Object.freeze([...report.taken_actions]) }), recipient: token.recipient }),
        sendOutcome: null, pendingSelection: null, submitting: false, submissionKind: null };
      return true;
    },
    reportFailed(token, outcome) {
      if (!currentSend(token)) return false;
      const kind = ['offline', 'http', 'unknown', 'no-account', 'account-changed', 'context', 'storage'].includes(outcome?.kind) ? outcome.kind : 'unknown';
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'sendPreview', check: setResume('sendPreview'),
        sendOutcome: Object.freeze({ kind }), submitting: false, submissionKind: null,
        sessionStatus: kind === 'no-account' ? Object.freeze({ status: 'none', account: null, revision: null }) : state.sessionStatus };
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
    hide() { state = { ...state, hidden: true, view: 'closed', pendingSelection: null, reports: noReports(state.reports.returnView) }; },
    show() { state = { ...state, hidden: false }; },
    resetForNewDocument() { state = { ...initial(), gen: state.gen + 1, sendGeneration: state.sendGeneration + 1 }; },
  };
}
