import { loginParent, logoutParent, readSessionStatus } from '../core/integration.js';

const strings = {
  title: 'Scamerinio — połącz z kontem rodzica',
  brand: 'Scamerinio',
  step1Heading: 'Połącz wtyczkę z kontem rodzica',
  step1Intro: 'Zaloguj się jako rodzic. Zgłoszenia, które dziecko wyśle przez wtyczkę, trafią do Twojego panelu.',
  emailLabel: 'Adres e-mail',
  emailEmpty: 'Wpisz adres e-mail.',
  emailInvalid: 'Wpisz poprawny adres e-mail.',
  next: 'Dalej',
  step2Heading: 'Wpisz kod',
  step2Intro: email => `Wpisz kod logowania dla adresu ${email}.`,
  codeLabel: 'Kod logowania',
  codeDigit: n => `Cyfra ${n} z 4`,
  codeEmpty: 'Wpisz kod logowania.',
  codeIncomplete: 'Kod ma 4 cyfry. Wpisz wszystkie.',
  submit: 'Zaloguj się',
  pending: 'Logowanie…',
  changeEmail: 'Zmień adres e-mail',
  invalidCredentials: 'Nieprawidłowy e-mail lub kod.',
  teacher: 'To konto nauczyciela. Wtyczkę na urządzeniu dziecka łączy rodzic — zaloguj się kontem rodzica.',
  network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj ponownie.',
  storage: 'Nie udało się zapisać logowania we wtyczce. Spróbuj ponownie.',
  connectedHeading: 'Wtyczka połączona',
  connectedBody: name => `Zalogowano jako ${name} — zgłoszenia trafią do Twojego konta.`,
  connectedHint: 'Możesz zamknąć tę kartę. Logowanie zostaje zapamiętane na tym urządzeniu.',
  logout: 'Wyloguj',
  loggedOut: 'Wylogowano. Dziecko nie wyśle zgłoszeń, dopóki ktoś nie zaloguje się kontem rodzica.',
  demoOpen: 'Zobacz konta demo',
  demoTitle: 'Konta demo',
  demoIntro: 'To wersja demonstracyjna z fikcyjnymi danymi. Wtyczkę łączy się kontem rodzica — wybierz jedno z kont poniżej.',
  demoUse: 'Użyj',
  demoCode: 'Kod logowania dla każdego konta: 0000',
  demoClose: 'Zamknij',
};

// Presentation parents only; source: projects/web-app/src/lib/contract/demo-accounts.ts.
const parentDemoAccounts = [
  { display_name: 'Mama Oli (demo)', email: 'rodzic.ola@bezpiecznaaura.example' },
  { display_name: 'Tata Kuby (demo)', email: 'rodzic.kuba@bezpiecznaaura.example' },
  { display_name: 'Mama Zosi (demo)', email: 'rodzic.zosia@bezpiecznaaura.example' },
];

document.title = strings.title;
const root = document.getElementById('login-root');
const state = { step: 'email', email: '', code: '', account: null, pending: false,
  emailError: '', codeError: '', formError: '', loggedOut: false };
let boxes = [];
let codeErrorNode;
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function button(text, onClick, primary = false) {
  const element = node('button', text, primary ? 'primary' : 'secondary');
  element.type = 'button';
  element.disabled = state.pending;
  if (onClick) element.addEventListener('click', onClick);
  return element;
}
function alert(text, role = 'alert') {
  const element = node('div', text, role === 'status' ? 'notice' : 'alert-error');
  element.setAttribute('role', role);
  return element;
}
function focusBox(index) {
  const box = boxes[Math.max(0, Math.min(index, state.code.length, 3))];
  box?.focus();
  box?.select();
}
function syncCode() {
  boxes.forEach((box, i) => {
    box.value = state.code[i] ?? '';
    box.setAttribute('aria-invalid', String(Boolean(state.codeError)));
    if (state.codeError) box.setAttribute('aria-describedby', 'login-code-error');
    else box.removeAttribute('aria-describedby');
  });
  codeErrorNode.textContent = state.codeError;
  codeErrorNode.hidden = !state.codeError;
}
function writeDigits(index, raw) {
  if (state.pending) return;
  const digits = raw.replace(/\D/g, '');
  if (!digits) { syncCode(); return; }
  const start = Math.min(index, state.code.length);
  state.code = (state.code.slice(0, start) + digits + state.code.slice(start + digits.length)).slice(0, 4);
  state.codeError = '';
  syncCode();
  focusBox(start + digits.length);
  if (state.code.length === 4) boxes[0].form.requestSubmit();
}
function codeInputs() {
  const group = node('div', undefined, 'otp');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-labelledby', 'login-code-label');
  boxes = Array.from({ length: 4 }, (_, index) => {
    const input = node('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 1;
    input.autocomplete = index === 0 ? 'one-time-code' : 'off';
    input.setAttribute('aria-label', strings.codeDigit(index + 1));
    input.readOnly = state.pending;
    input.id = `login-code-${index + 1}`;
    // beforeinput and paste receive all digits before the native maxlength truncation.
    input.addEventListener('beforeinput', event => {
      if (event.inputType.startsWith('insert') && typeof event.data === 'string') {
        event.preventDefault();
        writeDigits(index, event.data);
      }
    });
    input.addEventListener('input', () => {
      if (!input.value && !state.pending) {
        state.code = state.code.slice(0, index) + state.code.slice(index + 1);
        syncCode();
      } else writeDigits(index, input.value);
    });
    input.addEventListener('paste', event => {
      event.preventDefault();
      writeDigits(index, event.clipboardData.getData('text'));
    });
    input.addEventListener('focus', () => {
      if (index > state.code.length) focusBox(state.code.length);
      else input.select();
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Backspace') {
        event.preventDefault();
        if (state.pending) return;
        const removeAt = state.code[index] === undefined ? index - 1 : index;
        if (removeAt >= 0) state.code = state.code.slice(0, removeAt) + state.code.slice(removeAt + 1);
        state.codeError = '';
        syncCode();
        focusBox(removeAt);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        focusBox(index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    group.append(input);
    return input;
  });
  return group;
}
function submitEmail(event) {
  event.preventDefault();
  if (state.pending) return;
  state.email = state.email.trim();
  state.emailError = !state.email ? strings.emailEmpty
    : state.email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(state.email) ? strings.emailInvalid : '';
  if (!state.emailError) {
    state.step = 'code';
    state.code = '';
    state.codeError = '';
    state.formError = '';
    state.loggedOut = false;
  }
  renderLogin();
}
async function submitCode(event) {
  event.preventDefault();
  if (state.pending) return;
  if (!/^\d{4}$/.test(state.code)) {
    state.codeError = state.code ? strings.codeIncomplete : strings.codeEmpty;
    syncCode();
    focusBox(0);
    return;
  }
  state.pending = true;
  state.codeError = '';
  state.formError = '';
  const email = state.email, code = state.code;
  renderLogin(false);
  const result = await loginParent(email, code);
  state.pending = false;
  if (result.ok) {
    state.account = result.account;
    state.email = '';
    state.code = '';
  } else if (result.kind === 'http' && result.code === 'invalid_credentials') {
    state.code = '';
    state.codeError = strings.invalidCredentials;
  } else {
    state.formError = result.kind === 'storage' ? strings.storage
      : result.status === 403 && result.code === 'forbidden' ? strings.teacher : strings.network;
  }
  renderLogin();
}
async function logout() {
  if (state.pending) return;
  state.pending = true;
  state.formError = '';
  renderLogin(false);
  const result = await logoutParent();
  state.pending = false;
  if (result.ok) {
    Object.assign(state, { account: null, step: 'email', email: '', code: '', emailError: '', codeError: '', loggedOut: true });
  } else state.formError = strings.storage;
  renderLogin();
}
function openDemoAccounts(dialog) {
  if (!state.pending && !dialog.open) dialog.showModal();
}
function demoDialog() {
  const dialog = node('dialog', undefined, 'demo-dialog');
  dialog.setAttribute('aria-labelledby', 'demo-title');
  const heading = node('h2', strings.demoTitle);
  heading.id = 'demo-title';
  dialog.append(heading, node('p', strings.demoIntro, 'muted'));
  const accounts = node('ul', undefined, 'demo-accounts');
  for (const account of parentDemoAccounts) {
    const row = node('li');
    const details = node('div');
    details.append(node('p', account.display_name, 'account-name'), node('p', account.email, 'account-email'));
    row.append(details, button(strings.demoUse, () => {
      dialog.close();
      Object.assign(state, { step: 'email', email: account.email, code: '', emailError: '', codeError: '', formError: '', loggedOut: false });
      renderLogin(false);
    }));
    accounts.append(row);
  }
  dialog.append(accounts, node('p', strings.demoCode, 'notice'), button(strings.demoClose, () => dialog.close()));
  dialog.addEventListener('close', () => document.getElementById('login-demo-open')?.focus());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  return dialog;
}
function renderLogin(moveFocus = true) {
  const column = node('div', undefined, 'login-column');
  const brand = node('div', undefined, 'brand');
  const avatar = node('img');
  avatar.src = 'avatar-128.png';
  avatar.alt = '';
  avatar.width = 48;
  avatar.height = 48;
  brand.append(avatar, node('span', strings.brand));
  const card = node('section', undefined, 'login-card');
  const heading = node('h1', state.account ? strings.connectedHeading : state.step === 'email' ? strings.step1Heading : strings.step2Heading);
  heading.tabIndex = -1;
  card.append(heading);
  if (state.formError) card.append(alert(state.formError));
  let firstField;
  if (state.account) {
    card.append(node('p', strings.connectedBody(state.account.display_name)), node('p', strings.connectedHint, 'muted'), button(strings.logout, logout));
    firstField = heading;
  } else {
    card.append(node('p', state.step === 'email' ? strings.step1Intro : strings.step2Intro(state.email), 'muted'));
    if (state.loggedOut) card.append(alert(strings.loggedOut, 'status'));
    const form = node('form');
    form.noValidate = true;
    form.setAttribute('aria-busy', String(state.pending));
    if (state.step === 'email') {
      const label = node('label', strings.emailLabel);
      label.htmlFor = 'login-email';
      const input = node('input');
      input.id = 'login-email';
      input.name = 'email';
      input.type = 'email';
      input.autocomplete = 'email';
      input.maxLength = 254;
      input.value = state.email;
      input.setAttribute('aria-invalid', String(Boolean(state.emailError)));
      input.addEventListener('input', () => { state.email = input.value; });
      form.append(label, input);
      if (state.emailError) {
        const error = alert(state.emailError);
        error.id = 'login-email-error';
        input.setAttribute('aria-describedby', error.id);
        form.append(error);
      }
      const next = button(strings.next, null, true);
      next.type = 'submit';
      form.append(next);
      form.addEventListener('submit', submitEmail);
      firstField = input;
    } else {
      const label = node('label', strings.codeLabel);
      label.id = 'login-code-label';
      label.htmlFor = 'login-code-1';
      codeErrorNode = alert(state.codeError);
      codeErrorNode.id = 'login-code-error';
      form.append(label, codeInputs(), codeErrorNode);
      const submit = button(state.pending ? strings.pending : strings.submit, null, true);
      submit.type = 'submit';
      submit.setAttribute('aria-busy', String(state.pending));
      form.append(submit);
      form.addEventListener('submit', submitCode);
      const changeEmail = button(strings.changeEmail, () => {
        Object.assign(state, { step: 'email', code: '', codeError: '', formError: '' });
        renderLogin();
      });
      changeEmail.classList.add('change-email');
      card.append(form, changeEmail);
      syncCode();
      firstField = boxes[0];
    }
    if (state.step === 'email') card.append(form);
  }
  column.append(brand, card);
  if (!state.account) {
    const dialog = demoDialog();
    const open = button(strings.demoOpen, () => openDemoAccounts(dialog));
    open.id = 'login-demo-open';
    open.classList.add('demo-open');
    column.append(open, dialog);
  }
  root.replaceChildren(column);
  if (moveFocus) firstField?.focus();
}

// A local read never renews the token. Keep the form usable if storage is unavailable.
readSessionStatus().then(status => {
  state.account = status.status === 'connected' ? status.account : null;
  if (status.kind === 'storage') state.formError = strings.storage;
  renderLogin();
});
