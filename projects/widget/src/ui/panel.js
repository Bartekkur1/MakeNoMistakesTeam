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
      const focusedId = state.view === 'question' ? root.activeElement?.id : undefined;
      body.replaceChildren();
      el.hidden = !['menu', 'paste', 'howto', 'preview', 'confirmation', 'safety', 'question', 'result'].includes(state.view);
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
      if (state.view === 'safety') {
        body.append(node('p', strings.safetyNotice, 'notice'), button(strings.next, 'btn-primary', () => handlers.onSafetyNext()));
        body.querySelector('button').focus();
        return;
      }
      if (state.view === 'question') {
        const question = strings.checkQuestions.find(q => q.id === state.check.step);
        const selected = state.check.answers[question.id];
        const group = node('fieldset', undefined, 'question-options');
        group.append(node('legend', question.title));
        for (const option of question.options) {
          const row = node('div', undefined, 'question-option');
          const input = node('input');
          input.type = question.multiple ? 'checkbox' : 'radio';
          input.name = question.id;
          input.id = 'check-' + question.id + '-' + option.id;
          input.value = option.id;
          input.checked = selected.includes(option.id);
          input.addEventListener('change', () => handlers.onAnswer(question.id, option.id));
          const label = node('label');
          label.htmlFor = input.id;
          label.append(input, node('span', option.label));
          row.append(label);
          if (state.check.hints[question.id].includes(option.id)) row.append(node('span', strings.hintBadge, 'hint-badge'));
          group.append(row);
        }
        const next = button(strings.next, 'btn-primary', () => handlers.onQuestionNext(false));
        next.disabled = !selected.length;
        const row = node('div', undefined, 'row');
        row.append(button(strings.back, 'btn-secondary', () => handlers.onQuestionBack()), next);
        body.append(group, row);
        if (state.check.discrepancy) {
          const mismatch = state.check.discrepancy;
          const prompt = node('div', undefined, 'notice');
          prompt.setAttribute('role', 'alert');
          prompt.append(node('p', strings.checkMismatches[mismatch.messageKey]),
            button(strings.correctAnswer, 'btn-secondary', () => handlers.onAnswer(mismatch.questionId, mismatch.answerId)),
            button(strings.keepAnswer, 'btn-primary', () => handlers.onQuestionNext(true)));
          body.append(prompt);
        }
        const focused = [...group.querySelectorAll('input')].find(input => input.id === focusedId);
        (focused ?? group.querySelector('input:checked') ?? group.querySelector('input')).focus();
        return;
      }
      if (state.view === 'result') {
        const result = state.check.result;
        body.append(node('h2', strings.checkSummaries[result.summaryKey]));
        for (const key of ['signals', 'unknowns']) {
          const section = node('section', undefined, 'result-section');
          const list = node('ul');
          const copy = key === 'signals' ? strings.checkSignals : strings.checkUnknowns;
          for (const id of result[key].length ? result[key] : ['none']) list.append(node('li', copy[id]));
          const title = node('h3', strings.resultSections[key]);
          title.id = 'check-result-' + key;
          section.setAttribute('aria-labelledby', title.id);
          section.append(title, list);
          body.append(section);
        }
        const step = node('section', undefined, 'result-section result-step');
        const title = node('h3', strings.resultSections.step);
        title.id = 'check-result-step';
        step.setAttribute('aria-labelledby', title.id);
        step.append(title, node('p', strings.checkSteps[result.step.id]), node('p', strings.checkSteps[result.step.explanationKey]));
        body.append(step, button(strings.fixAnswers, 'btn-secondary', () => handlers.onFixAnswers()));
        body.querySelector('button').focus();
        return;
      }
      if (state.pendingSelection) {
        const insert = button(strings.insertNewSelection, 'btn-secondary', () => handlers.onInsertSelection());
        insert.disabled = Boolean(state.submitting);
        body.append(node('p', strings.newSelectionHint, 'hint'), insert);
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
      if (state.draft.truncated) body.append(node('p', strings.truncatedNotice, 'hint'));
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
