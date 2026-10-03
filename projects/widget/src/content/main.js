import { HOST_TAG, createHost } from './host.js';
import { createAvatar } from './avatar.js';
import { createPanel } from '../ui/panel.js';
import { STRINGS } from '../ui/strings.pl.js';
import { createDraftStore } from '../core/draft.js';
import { buildCase } from '../core/case.js';
import { MSG_SHOW } from '../core/messages.js';
import { submitCase } from '../core/integration.js';

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
  const panel = createPanel({ root, strings: STRINGS, handlers: {
    onInsertSelection() { store.insertPendingSelection(); render(); },
    onCheck() { store.showPaste(); render(); },
    onHowTo() { store.showHowTo(); render(); },
    onBack() { store.back(); render(); },
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
    async onApprove() {
      let c;
      try { c = buildCase({ ...store.get().draft }, new Date(), location); }
      catch { return; }
      const token = store.beginSubmit();
      if (token === null) return;
      render();
      try { await submitCase(c); store.approved(token, c); }
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
  function render() {
    const state = store.get();
    avatar.setHidden(state.hidden);
    panel.render(state, { host: location.hostname });
    placePanel(avatar.rect());
  }
  const resize = () => { avatar.reclamp({ width: innerWidth, height: innerHeight }); render(); };
  window.addEventListener('resize', resize);
  const pagehide = () => { store.resetForNewDocument(); render(); };
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
