import { normalizeText } from '../core/case.js';

export function createPanel({ root, strings, handlers }) {
  const doc = root.ownerDocument;
  const node = (tag, text, className) => {
    const el = doc.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const el = node('section', undefined, 'panel');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', strings.panelLabel);
  el.hidden = true;
  const header = node('header');
  const close = node('button', strings.closeSymbol);
  close.type = 'button';
  close.setAttribute('aria-label', strings.closeLabel);
  close.addEventListener('click', () => handlers.onClose());
  header.append(close);
  const body = node('div');
  el.append(header, body);
  root.append(el);
  return {
    el,
    render(state, ctx) {
      body.replaceChildren();
      el.hidden = !['preview', 'confirmation'].includes(state.view);
      if (el.hidden) return;
      if (state.view === 'confirmation') {
        const done = node('button', strings.confirmationClose, 'btn-secondary');
        done.type = 'button';
        done.addEventListener('click', () => handlers.onClose());
        body.append(node('h2', strings.confirmationHeading), node('p', strings.confirmationBody), done);
        return;
      }
      const textarea = node('textarea');
      textarea.setAttribute('aria-label', strings.messageLabel);
      textarea.value = state.draft.text;
      const link = node('input');
      link.type = 'text';
      link.setAttribute('aria-label', strings.linkLabel);
      link.placeholder = strings.linkPlaceholder;
      link.value = state.draft.link;
      link.autocomplete = 'off';
      link.spellcheck = false;
      const approve = node('button', strings.approve, 'btn-primary');
      approve.type = 'button';
      approve.disabled = !normalizeText(textarea.value);
      textarea.addEventListener('input', () => {
        handlers.onEdit({ text: textarea.value });
        approve.disabled = !normalizeText(textarea.value);
      });
      link.addEventListener('input', () => handlers.onEdit({ link: link.value }));
      approve.addEventListener('click', () => handlers.onApprove());
      body.append(node('h2', strings.previewHeading), node('p', strings.sourcePrefix + ' ' + ctx.host, 'source'),
        textarea, link, node('p', strings.previewHint, 'hint'), node('p', strings.guardianNotice, 'notice'));
      if (state.error === 'submit') body.append(node('p', strings.submitError, 'error'));
      body.append(approve);
      textarea.focus();
    },
    place(avatarRect, viewport) {
      const { width, height } = el.getBoundingClientRect();
      const preferredTop = avatarRect.top - height - 12;
      const top = preferredTop >= 8 ? preferredTop : avatarRect.bottom + 12;
      const clamp = (value, max) => Math.max(8, Math.min(value, max));
      el.style.left = clamp(avatarRect.right - width, viewport.width - width - 8) + 'px';
      el.style.top = clamp(top, viewport.height - height - 8) + 'px';
    },
  };
}
