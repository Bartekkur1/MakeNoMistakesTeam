import { normalizeText } from '../core/case.js';
import { ATTACK_TYPES, ATTACK_TYPE_LABELS_PL, TAKEN_ACTIONS, TAKEN_ACTION_LABELS_PL, ACTIONS_BY_ATTACK_TYPE, REPORT_SOURCES, REPORT_SOURCE_LABELS_PL } from '../../../web-app/src/lib/contract/types.ts';

const capitalized = text => text[0].toLocaleUpperCase('pl-PL') + text.slice(1);

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
  const appendReplacement = state => {
    if (!normalizeText(state.pendingSelection?.text)) return;
    const replace = button(strings.checkNewSelection, 'btn-secondary', () => handlers.onCheckNewSelection());
    replace.disabled = Boolean(state.submitting);
    body.append(replace);
  };
  // Only fixed, trusted destinations from strings become anchors; supplied links stay text.
  const trustedLink = ({ text, href }) => {
    const a = node('a', text);
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.style.color = 'var(--color-shark-blue-dark)'; a.style.textDecoration = 'underline'; a.style.fontSize = '15px';
    return a;
  };
  const sourceSelect = (id, value, disabled, handler) => {
    const select = node('select'); select.id = id; select.disabled = disabled;
    for (const source of REPORT_SOURCES) {
      const option = node('option', capitalized(REPORT_SOURCE_LABELS_PL[source]));
      option.value = source; select.append(option);
    }
    select.value = value;
    select.addEventListener('change', () => handler(select.value));
    return select;
  };
  const noAccountNotice = () => {
    const notice = node('div', undefined, 'notice');
    notice.append(node('p', strings.noAccount), button(strings.openLogin, 'btn-secondary', () => handlers.onOpenLogin()));
    return notice;
  };
  const confirmation = state => {
    if (!state.sentReport) return;
    const { report, recipient } = state.sentReport;
    const notice = node('div', undefined, 'notice');
    const time = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(new Date(report.created_at));
    notice.append(node('h2', strings.sentRecipientPrefix + ' ' + recipient.display_name),
      node('p', strings.sentTimePrefix + ' ' + time), node('p', strings.sentStatus), node('p', strings.sentHint, 'hint'));
    const row = node('div', undefined, 'row');
    const done = button(strings.confirmationClose, 'btn-primary', () => handlers.onClose());
    row.append(button(strings.checkNewMessage, 'btn-secondary', () => handlers.onFinishCheck()), done);
    body.append(notice, row);
    appendReplacement(state);
    done.focus();
  };
  return {
    el,
    render(state, ctx) {
      const focusedId = ['question', 'sendPreview', 'platformHowTo'].includes(state.view) ? root.activeElement?.id : undefined;
      body.replaceChildren();
      el.hidden = !['menu', 'paste', 'howto', 'preview', 'confirmation', 'safety', 'question', 'result', 'sendPreview', 'myReports', 'platformHowTo'].includes(state.view);
      if (el.hidden) return;
      if (state.view === 'menu') {
        const menu = node('div', undefined, 'menu');
        menu.append(button(strings.menuCheck, 'btn-primary', () => handlers.onCheck()),
          button(strings.menuReports, 'btn-secondary', () => handlers.onMyReports()),
          button(strings.menuHowTo, 'btn-secondary', () => handlers.onHowTo()));
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
        confirmation(state);
        return;
      }
      if (state.view === 'myReports') {
        // Navigation contract for 03-03; list fetching/rendering belongs to that plan.
        body.append(node('h2', strings.myReports), button(strings.back, 'btn-secondary', () => handlers.onSendBack()));
        body.querySelector('button').focus();
        return;
      }
      if (state.view === 'sendPreview') {
        const preview = state.sendPreview;
        if (!preview) return;
        const review = node('div');
        review.setAttribute('aria-busy', String(Boolean(state.submitting)));
        const content = node('div', preview.content, 'sent-content');
        content.tabIndex = 0;
        content.setAttribute('aria-label', strings.reportContentLabel);
        review.className = 'send-review';
        review.append(node('h2', strings.sendPreviewHeading), node('p', strings.recipientPrefix, 'source'),
          node('p', preview.recipient.display_name, 'recipient'), node('p', strings.messageLabel, 'field-label'), content,
          node('p', strings.sendEditHint, 'hint'));
        const attacks = node('fieldset', undefined, 'question-options review-block');
        attacks.append(node('legend', strings.attackLegend));
        const choices = (group, values, labels, type, selected, handler) => {
          for (const value of values) {
            const option = node('div', undefined, 'question-option');
            const input = node('input');
            input.type = type;
            input.id = 'report-' + type + '-' + value;
            input.name = type === 'radio' ? 'report-attack' : 'report-actions';
            input.value = value;
            input.checked = selected.includes(value);
            input.disabled = Boolean(state.submitting);
            input.addEventListener('change', () => handler(value));
            const label = node('label'); label.htmlFor = input.id;
            label.append(input, node('span', capitalized(labels[value])));
            option.append(label);
            if (type === 'radio' && value === preview.proposal) option.append(node('span', strings.proposalBadge, 'hint-badge'));
            group.append(option);
          }
        };
        choices(attacks, ATTACK_TYPES, ATTACK_TYPE_LABELS_PL, 'radio', [preview.attack_type], value => handlers.onReportAttackChange(value));
        const actions = node('fieldset', undefined, 'question-options review-block');
        actions.append(node('legend', strings.actionsLegend), node('p', strings.actionsHint, 'hint'));
        choices(actions, TAKEN_ACTIONS.filter(action => ACTIONS_BY_ATTACK_TYPE[preview.attack_type].includes(action)),
          TAKEN_ACTION_LABELS_PL, 'checkbox', preview.taken_actions, value => handlers.onReportActionChange(value));
        const sourceBlock = node('div', undefined, 'review-block');
        const sourceLabel = node('label', strings.reportSourceLabel, 'field-label');
        sourceLabel.htmlFor = 'report-source';
        const source = sourceSelect('report-source', preview.source, Boolean(state.submitting), value => handlers.onReportSourceChange(value));
        sourceBlock.append(sourceLabel, source);
        review.append(attacks, actions, sourceBlock, node('p', strings.sendPrivacy, 'notice review-block'));
        if (!state.submitting && (state.sessionStatus.status === 'none' || state.sendOutcome?.kind === 'no-account')) review.append(noAccountNotice());
        else if (state.sendOutcome) {
          const copy = strings.sendOutcomes[state.sendOutcome.kind] ?? strings.sendOutcomes.http;
          const alert = node('div', undefined, state.sendOutcome.kind === 'unknown' ? 'alert-warning' : 'alert-error');
          alert.setAttribute('role', 'alert');
          alert.append(node('h3', copy.title), node('p', copy.body));
          review.append(alert);
        }
        const row = node('div', undefined, 'row');
        const back = button(strings.back, 'btn-secondary', () => handlers.onSendBack());
        back.disabled = Boolean(state.submitting);
        const kind = state.sendOutcome?.kind;
        const noAccount = !state.submitting && (state.sessionStatus.status === 'none' || kind === 'no-account');
        let retry;
        if (kind === 'unknown') row.append(button(strings.myReports, 'btn-secondary', () => handlers.onMyReports()));
        else row.append(back);
        if (!noAccount && kind !== 'context') {
          const label = state.submitting ? strings.sending : kind === 'unknown' ? strings.sendAgain : kind ? strings.sendRetry : strings.send;
          retry = button(label, 'btn-primary', () => handlers.onSendReport());
          retry.disabled = Boolean(state.submitting) || state.sessionStatus.status !== 'connected';
          row.append(retry);
        }
        review.append(row);
        if (state.submitting) {
          for (const control of review.querySelectorAll('button, input, select')) control.disabled = true;
          content.tabIndex = -1;
        }
        body.append(review);
        const focused = focusedId ? [...review.querySelectorAll('input, select')].find(control => control.id === focusedId) : null;
        (state.submitting ? close : focused ?? (kind ? retry && !retry.disabled ? retry : review.querySelector('button:not(:disabled)') : content) ?? content).focus();
        return;
      }
      if (state.view === 'platformHowTo') {
        // D-15: fixed local copy only; no handler here reaches the network or sends a report.
        const value = REPORT_SOURCES.includes(state.reportSource) ? state.reportSource : 'other';
        const sourceBlock = node('div', undefined, 'review-block');
        const label = node('label', strings.reportSourceLabel, 'field-label');
        label.htmlFor = 'platform-source';
        const select = sourceSelect('platform-source', value, false, next => handlers.onPlatformSourceChange(next));
        sourceBlock.append(label, select);
        const steps = node('ol', undefined, 'steps');
        for (const text of strings.platformSteps[value]) steps.append(node('li', text));
        body.append(node('h2', strings.platformHeading), node('p', strings.platformNotice, 'notice'), sourceBlock, steps);
        if (value === 'game') { const p = node('p'); p.append(trustedLink(strings.platformRoblox)); body.append(p); }
        const elsewhere = node('section', undefined, 'result-section');
        const title = node('h3', strings.platformElsewhere);
        title.id = 'platform-elsewhere';
        elsewhere.setAttribute('aria-labelledby', title.id);
        const list = node('ul');
        for (const destination of strings.platformLinks) {
          const item = node('li');
          item.append(trustedLink(destination), doc.createTextNode(' — ' + destination.use));
          list.append(item);
        }
        elsewhere.append(title, list);
        const back = button(strings.platformBack, 'btn-secondary', () => handlers.onPlatformBack());
        const row = node('div', undefined, 'row');
        row.append(back);
        body.append(elsewhere, node('p', strings.platformSafety), row);
        (focusedId === 'platform-source' ? select : back).focus();
        return;
      }
      if (state.view === 'safety') {
        body.append(node('p', strings.safetyNotice, 'notice'), button(strings.next, 'btn-primary', () => handlers.onSafetyNext()),
          button(strings.editCheckContent, 'btn-secondary', () => handlers.onEditCheckContent()));
        appendReplacement(state);
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
          // A message link is evidence about the text, not the child's independent channels.
          if (question.id !== 'verify' && state.check.hints[question.id].includes(option.id)) row.append(node('span', strings.hintBadge, 'hint-badge'));
          group.append(row);
        }
        const next = button(strings.next, 'btn-primary', () => handlers.onQuestionNext(false));
        next.disabled = !selected.length;
        const row = node('div', undefined, 'row');
        row.append(button(strings.back, 'btn-secondary', () => handlers.onQuestionBack()), next);
        body.append(group, row, button(strings.editCheckContent, 'btn-secondary', () => handlers.onEditCheckContent()));
        appendReplacement(state);
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
        if (state.sentReport) { confirmation(state); return; }
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
        const handoff = node('div', undefined, 'actions');
        if (state.sessionStatus?.status === 'none') handoff.append(noAccountNotice());
        else {
          const request = button(strings.showSendPreview, 'btn-primary', () => handlers.onShowSendPreview());
          request.disabled = state.sessionStatus?.status !== 'connected';
          handoff.append(request);
        }
        // HND-02: independent of the parent connection; opens local guidance only.
        handoff.append(button(strings.platformHowTo, 'btn-secondary', () => handlers.onPlatformHowTo()));
        body.append(step, handoff, button(strings.fixAnswers, 'btn-secondary', () => handlers.onFixAnswers()),
          button(strings.editCheckContent, 'btn-secondary', () => handlers.onEditCheckContent()));
        appendReplacement(state);
        (handoff.querySelector('button:not(:disabled)') ?? body.querySelector('button:not(:disabled)') ?? close).focus();
        return;
      }
      if (state.pendingSelection && !state.candidateKind) {
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
      if (state.candidateKind) {
        const cancel = button(strings.cancelCheckEdit, 'btn-secondary', () => handlers.onCancelCheckEdit());
        cancel.disabled = Boolean(state.submitting);
        body.append(cancel);
      }
      textarea.focus();
    },
    place(avatarRect, viewport) {
      const { width, height } = el.getBoundingClientRect();
      const pos = computePanelPosition(avatarRect, { width, height }, viewport);
      el.style.left = pos.left + 'px'; el.style.top = pos.top + 'px';
    },
  };
}
