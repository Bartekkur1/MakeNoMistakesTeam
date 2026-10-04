import { HOST_TAG, createHost } from './host.js';
import { createAvatar } from './avatar.js';
import { createPanel } from '../ui/panel.js';
import { STRINGS } from '../ui/strings.pl.js';
import { createDraftStore } from '../core/draft.js';
import { buildCase, normalizeText, normalizeLink } from '../core/case.js';
import { MSG_SHOW } from '../core/messages.js';
import { submitCase, readSessionStatus, openLogin, submitReport, readReportOutcome, clearReportOutcome } from '../core/integration.js';

function boot() {
  const runtime = chrome.runtime;
  const isLive = () => { try { return Boolean(runtime?.id); } catch { return false; } };
  const existing = document.querySelector(HOST_TAG);
  if (existing) {
    if (!existing.dispatchEvent(new CustomEvent('bezpieczna-aura-ping', { cancelable: true }))) return;
    existing.remove();
  }
  const { host, root } = createHost();
  const store = createDraftStore();
  let sessionRead = 0;
  let visibleView = 'closed';
  let visibleCase = null;
  const dispatchedSends = new WeakSet();
  const clearOutcome = caseId => { if (caseId) void clearReportOutcome(caseId); };
  const panel = createPanel({ root, strings: STRINGS, handlers: {
    onInsertSelection() { store.insertPendingSelection(); render(); },
    onCheck() { store.showPaste(); render(); },
    onHowTo() { store.showHowTo(); render(); },
    onBack() { store.back(); render(); },
    onFinishCheck() { const old = store.get().case_id; store.finishCheck(); if (old !== store.get().case_id) clearOutcome(old); render(); },
    onPasteNext(values) { store.submitPaste(values); render(); },
    onPasteEdit(patch) { store.editPaste(patch); },
    onEdit(patch) { store.edit(patch); },
    onClose() { store.close(); render(); },
    onSafetyNext() { store.startQuestions(); render(); },
    onAnswer(questionId, answerId) { store.answer(questionId, answerId); render(); },
    onQuestionNext(keep = false) { store.nextQuestion(keep); render(); },
    onQuestionBack() { store.previousQuestion(); render(); },
    onFixAnswers() { store.fixAnswers(); render(); },
    onEditCheckContent() { store.editCheckContent(); render(); },
    onCancelCheckEdit() { store.cancelCheckEdit(); render(); },
    onCheckNewSelection() { store.checkNewSelection(); render(); },
    onShowSendPreview() { if (store.openSendPreview()) render(); },
    onReportAttackChange(value) { if (store.setSendAttackType(value)) render(); },
    onReportActionChange(value) { if (store.toggleSendAction(value)) render(); },
    onReportSourceChange(value) { if (store.setReportSource(value)) render(); },
    onSendBack() { if (store.backFromSendPreview()) render(); },
    onOpenLogin() { void openLogin(); },
    // D-15: local guidance only — no runtime message, recapture or network request.
    onPlatformHowTo() { if (store.openPlatformHowTo()) render(); },
    onPlatformSourceChange(value) { if (store.setPlatformSource(value)) render(); },
    onPlatformBack() { if (store.backFromPlatformHowTo()) render(); },
    onMyReports() { if (store.showMyReports()) render(); },
    async onSendReport() {
      // Lock immediately, before the local account read, to prevent double clicks.
      const token = store.beginReportSend();
      if (!token) return;
      render();
      const metadata = await readSessionStatus();
      if (store.get().sendOperation !== token || !store.get().submitting) return;
      if (metadata.status !== 'connected' || metadata.account.id !== token.expected_account_id
        || metadata.revision !== token.session_revision) {
        const kind = metadata.status === 'none' ? 'no-account' : metadata.status === 'connected' ? 'account-changed' : 'context';
        if (store.reportFailed(token, { kind })) {
          store.setSessionStatus(metadata);
          render();
        }
        return;
      }
      dispatchedSends.add(token);
      const response = await submitReport(token);
      if (response.ok) {
        if (store.reportSent(token, response)) render();
        else if (store.reportFailed(token, { kind: 'unknown' })) render();
      } else if (response.kind === 'context') {
        // Once report RPC was invoked, a lost runtime reply cannot prove no POST.
        await reconcileSend(token);
      } else if (store.reportFailed(token, response)) {
        render();
        if (response.kind === 'account-changed') void refreshSession();
      }
    },
    async onApprove() {
      let c;
      try { c = buildCase({ ...store.get().draft }, new Date(), location); }
      catch { return; }
      const state = store.get();
      if (state.candidateKind && state.check && normalizeText(state.check.case.content) === c.content
          && normalizeLink(state.check.case.link) === c.link) {
        store.cancelCheckEdit(); render(); return;
      }
      const token = store.beginSubmit();
      if (token === null) return;
      render();
      const oldCaseId = state.case_id;
      try {
        await submitCase(c);
        if (!store.approved(token, c)) store.submitFailed(token);
        else if (oldCaseId !== store.get().case_id) clearOutcome(oldCaseId);
      }
      catch { store.submitFailed(token); }
      render();
    },
  } });
  const avatar = createAvatar({ host, root, strings: STRINGS,
    onActivate(captured) { store.onAvatarClick(captured); render(); },
    onHide() { store.hide(); render(); },
    onMove: placePanel });
  function placePanel(rect) {
    const state = store.get();
    if (!state.hidden && state.view !== 'closed') panel.place(rect, { width: innerWidth, height: innerHeight });
  }
  async function refreshSession() {
    const query = ++sessionRead;
    const { case_id, gen } = store.get();
    if (!store.get().submitting) store.setSessionStatus({ status: 'unknown' });
    render();
    const metadata = await readSessionStatus();
    if (query !== sessionRead || store.get().case_id !== case_id || store.get().gen !== gen) return;
    if (store.setSessionStatus(metadata) && ['result', 'sendPreview'].includes(store.get().view)) render();
  }
  async function reconcileSend(token) {
    const response = await readReportOutcome(token.case_id);
    if (response.ok && response.report) {
      if (store.reportSent(token, response)) render();
      else if (store.reportFailed(token, { kind: 'unknown' })) render();
    } else if (store.reportFailed(token, response.ok || response.kind === 'context' ? { kind: 'unknown' } : response)) render();
  }
  function render() {
    const state = store.get();
    avatar.setHidden(state.hidden);
    panel.render(state, { host: location.hostname });
    placePanel(avatar.rect());
    const reopened = state.view !== visibleView || state.case_id !== visibleCase;
    visibleView = state.view;
    visibleCase = state.case_id;
    if (reopened && ['result', 'sendPreview'].includes(state.view)) {
      void refreshSession();
      if (state.submissionKind === 'report' && dispatchedSends.has(state.sendOperation)) void reconcileSend(state.sendOperation);
    }
  }
  const resize = () => { avatar.reclamp({ width: innerWidth, height: innerHeight }); render(); };
  window.addEventListener('resize', resize);
  const pagehide = () => { clearOutcome(store.get().case_id); ++sessionRead; store.resetForNewDocument(); render(); };
  window.addEventListener('pagehide', pagehide);
  host.addEventListener('bezpieczna-aura-ping', event => {
    if (isLive()) event.preventDefault();
    else { host.remove(); window.removeEventListener('resize', resize); window.removeEventListener('pagehide', pagehide); }
  });
  runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!isLive() || sender?.id !== runtime.id || msg?.type !== MSG_SHOW) return;
    store.show(); render(); sendResponse({ ok: true });
  });
  render();
}
boot();
