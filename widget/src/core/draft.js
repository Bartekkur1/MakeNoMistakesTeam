const initial = () => ({ view: 'closed', draft: null, pendingSelection: null, hidden: false, error: null });

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
      const edits = {};
      for (const key of ['text', 'link']) if (Object.hasOwn(patch, key)) edits[key] = patch[key];
      state = { ...state, draft: state.draft ? { ...state.draft, ...edits } : null };
    },
    close() { state = { ...state, view: 'closed' }; },
    approved() { state = { ...state, view: 'confirmation', draft: null, pendingSelection: null, error: null }; },
    submitFailed() { state = { ...state, view: 'preview', error: 'submit' }; },
    hide() { state = { ...state, hidden: true, view: 'closed' }; },
    show() { state = { ...state, hidden: false }; },
    resetForNewDocument() { state = initial(); },
  };
}
