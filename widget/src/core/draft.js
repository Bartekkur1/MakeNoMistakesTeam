const initial = () => ({ view: 'closed', draft: null, pendingSelection: null, hidden: false, error: null, submitting: false, gen: 0 });

export function createDraftStore() {
  let state = initial();
  return {
    get: () => state,
    onAvatarClick({ text, truncated }) {
      if (state.draft) state = { ...state, view: 'preview' };
      else if (text) state = { ...state, view: 'preview', draft: { text, link: '', origin: 'selection', truncated: Boolean(truncated) } };
      else state = { ...state, view: 'menu' };
    },
    edit(patch) {
      if (state.submitting) return;
      const edits = {};
      for (const key of ['text', 'link']) if (Object.hasOwn(patch, key)) edits[key] = patch[key];
      state = { ...state, draft: state.draft ? { ...state.draft, ...edits } : null };
    },
    close() { state = { ...state, view: 'closed' }; },
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
    hide() { state = { ...state, hidden: true, view: 'closed' }; },
    show() { state = { ...state, hidden: false }; },
    resetForNewDocument() { state = { ...initial(), gen: state.gen + 1 }; },
  };
}
