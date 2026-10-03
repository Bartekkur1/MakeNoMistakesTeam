import { normalizeText } from '../core/case.js';

export function computePanelPosition(avatarRect, panelSize, viewport, { gap = 12, margin = 8 } = {}) {
  const { width, height } = panelSize;
  const above = avatarRect.top - gap - height;
  const top = above < margin ? avatarRect.bottom + gap : above;
  const clamp = (value, extent, size) => Math.max(margin, Math.min(value, Math.max(margin, extent - size - margin)));
  return { left: clamp(avatarRect.right - width, viewport.width, width), top: clamp(top, viewport.height, height) };
}

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
  el.addEventListener('keydown', event => { if (event.key === 'Escape') handlers.onClose(); });
  const button = (text, className, handler) => {
    const b = node('button', text, className); b.type = 'button'; b.addEventListener('click', handler); return b;
  };
  return {
    el,
    render(state, ctx) {
      body.replaceChildren();
      el.hidden = !['menu', 'paste', 'howto', 'preview', 'confirmation'].includes(state.view);
      if (el.hidden) return;
      if (state.view === 'menu') {
        const menu = node('div', undefined, 'menu');
        menu.append(button(strings.menuCheck, 'btn-primary', () => handlers.onCheck()), button(strings.menuHowTo, 'btn-secondary', () => handlers.onHowTo()));
        body.append(node('p', strings.menuIntro, 'intro'), menu);
        menu.querySelector('button').focus();
        return;
      }
      if (state.view === 'howto') {
        const steps = node('ol', undefined, 'steps'); for (const text of strings.howToSteps) steps.append(node('li', text));
        body.append(node('h2', strings.howToHeading), steps, node('p', strings.howToPrivacy, 'privacy'), button(strings.back, 'btn-secondary', () => handlers.onBack()));
        body.querySelector('button').focus();
        return;
      }
      if (state.view === 'paste') {
        const text = node('textarea'); text.setAttribute('aria-label', strings.messageLabel); text.placeholder = strings.pastePlaceholder; text.value = state.paste.text;
        const link = node('input'); link.type = 'text'; link.setAttribute('aria-label', strings.linkLabel); link.placeholder = strings.linkPlaceholder; link.autocomplete = 'off'; link.value = state.paste.link;
        const next = button(strings.next, 'btn-primary', () => handlers.onPasteNext({ text: text.value, link: link.value }));
        next.disabled = !normalizeText(text.value);
        text.addEventListener('input', () => { handlers.onPasteEdit({ text: text.value }); next.disabled = !normalizeText(text.value); });
        link.addEventListener('input', () => handlers.onPasteEdit({ link: link.value }));
        const row = node('div', undefined, 'row'); row.append(button(strings.back, 'btn-secondary', () => handlers.onBack()), next);
        body.append(node('h2', strings.pasteHeading), text, link);
        if (state.error === 'empty') body.append(node('p', strings.emptyHint, 'hint'));
        body.append(row); text.focus(); return;
      }
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
      textarea.readOnly = Boolean(state.submitting);
      link.readOnly = Boolean(state.submitting);
      approve.disabled = state.submitting || !normalizeText(textarea.value);
      textarea.addEventListener('input', () => {
        handlers.onEdit({ text: textarea.value });
        approve.disabled = state.submitting || !normalizeText(textarea.value);
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
      const pos = computePanelPosition(avatarRect, { width, height }, viewport);
      el.style.left = pos.left + 'px'; el.style.top = pos.top + 'px';
    },
  };
}
