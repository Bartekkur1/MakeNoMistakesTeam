import { normalizeText, capCodePoints, normalizeLink, extractFirstLink } from './case.js';
const initial = () => ({ view: 'closed', draft: null, pendingSelection: null, hidden: false, error: null, submitting: false, gen: 0, paste: { text: '', link: '' } });

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
    approved(token) {
      if (!state.submitting || token !== state.gen) return false;
      state = { ...state, view: state.view === 'closed' ? 'closed' : 'confirmation', draft: null, pendingSelection: null, error: null, submitting: false };
      return true;
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
