import { HOST_TAG, createHost } from './host.js';
import { createAvatar } from './avatar.js';
import { createPanel } from '../ui/panel.js';
import { STRINGS } from '../ui/strings.pl.js';
import { createDraftStore } from '../core/draft.js';
import { buildCase } from '../core/case.js';
import { submitCase } from '../core/integration.js';

function boot() {
  if (document.querySelector(HOST_TAG)) return;
  const { host, root } = createHost();
  const store = createDraftStore();
  const panel = createPanel({ root, strings: STRINGS, handlers: {
    onEdit(patch) { store.edit(patch); },
    onClose() { store.close(); render(); },
    async onApprove() {
      let c;
      try { c = buildCase({ ...store.get().draft }, new Date(), location); }
      catch { return; }
      const token = store.beginSubmit();
      if (token === null) return;
      render();
      try { await submitCase(c); store.approved(token); }
      catch { store.submitFailed(token); }
      render();
    },
  } });
  const avatar = createAvatar({ host, root, strings: STRINGS,
    onActivate(captured) { store.onAvatarClick(captured); render(); } });
  function render() {
    const state = store.get();
    avatar.setHidden(state.hidden);
    panel.render(state, { host: location.hostname });
    if (state.view !== 'closed') panel.place(avatar.rect(), { width: innerWidth, height: innerHeight });
  }
  render();
}
boot();
