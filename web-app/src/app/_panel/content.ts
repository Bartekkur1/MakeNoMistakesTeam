// Panel copy (02-UI-SPEC.md, Copywriting Contract). All panel-authored text lives here.
// Copy rules: no em dashes, no " - " joining clauses, and nothing that marks the app as a
// presentation build (D-02). Contract labels and API error messages are imported from
// @/lib/contract/types where they are shown and are never copied into this file.
// LOGIN_HREF is not redefined here: import it from "@/app/_landing/content".

export const PANEL_HREF = "/panel";

export function reportHref(id: string): string {
  return `/panel/${encodeURIComponent(id)}`;
}

export const SHELL = {
  brand: "BezpiecznaAura",
  loading: "Wczytywanie panelu…",
  logout: "Wyloguj się",
  loggedOut: "Wylogowano.",
};

export const LOGIN = {
  step1Title: "Zaloguj się do panelu",
  step1Intro: "Panel dla rodziców i nauczycieli.",
  emailLabel: "Adres e-mail",
  emailEmpty: "Wpisz adres e-mail.",
  emailInvalid: "Wpisz poprawny adres e-mail.",
  next: "Dalej",
  step2Title: "Wpisz kod",
  step2Intro: "Wpisz kod logowania dla adresu {email}.",
  codeLabel: "Kod logowania",
  codeEmpty: "Wpisz kod logowania.",
  submit: "Zaloguj się",
  pending: "Logowanie…",
  changeEmail: "Zmień adres e-mail",
  backHome: "Wróć na stronę główną",
};

export const LIST = {
  title: "Zgłoszenia",
  subtitle: {
    parent: "Sprawy, które przekazało Ci dziecko.",
    teacher: "Sprawy uczniów Twojej klasy, które rodzice przekazali szkole.",
  },
  filterLabel: "Stan",
  filterAll: "Wszystkie stany",
  refresh: "Odśwież listę",
  refreshPending: "Odświeżanie…",
  refreshed: "Odświeżono {time}",
  refreshedAnnouncement: "Lista odświeżona.",
  more: "Pokaż więcej zgłoszeń",
  morePending: "Wczytywanie…",
  moreAnnouncement: "Wczytano kolejne zgłoszenia.",
  loading: "Wczytywanie zgłoszeń…",
  emptyTitle: "Nie ma jeszcze zgłoszeń",
  emptyBody: {
    parent: "Gdy dziecko przekaże Ci podejrzaną wiadomość, zobaczysz ją tutaj.",
    teacher: "Gdy rodzic przekaże szkole zgłoszenie ucznia z Twojej klasy, zobaczysz je tutaj.",
  },
  emptyFilteredTitle: "Brak zgłoszeń w stanie „{state}”",
  showAllStates: "Pokaż wszystkie stany",
  metaSeparator: " · ",
};

// Risk marker on list rows (D-04, D-10): "Ryzyko: " plus the categories present, joined with ", ".
export const RISK = {
  prefix: "Ryzyko: ",
  separator: ", ",
  click: "kliknięcie",
  data: "podanie danych",
  payment: "zapłata",
};

// The report detail page (/panel/[id]). The not-found heading is the contract message
// API_ERROR_MESSAGES_PL.report_not_found, used where it is shown.
export const DETAIL = {
  back: "Wróć do listy zgłoszeń",
  loading: "Wczytywanie zgłoszenia…",
  refresh: "Odśwież zgłoszenie",
  refreshPending: "Odświeżanie…",
  refreshed: "Odświeżono {time}",
  refreshedAnnouncement: "Zgłoszenie odświeżone.",
  contentTitle: "Treść wiadomości",
  terms: {
    child: "Dziecko",
    source: "Źródło",
    attackType: "Rodzaj ataku",
    createdAt: "Zgłoszono",
    updatedAt: "Ostatnia zmiana",
  },
  takenTitle: "Co dziecko już zrobiło",
  takenHelper: "Odpowiedź dziecka na pytanie: czy już kliknąłeś, podałeś dane lub zapłaciłeś?",
  riskyTag: "ryzykowne",
  takenEmpty: "Nic z tych rzeczy: dziecko nie kliknęło, nie podało danych i nie zapłaciło.",
  notFoundBody: "Zgłoszenie nie istnieje albo nie masz już do niego dostępu.",
};

// The merged history and comment timeline on the detail page (D-13).
export const TIMELINE = {
  title: "Historia i komentarze",
  stateChange: "Zmiana stanu",
  comment: "Komentarz",
  own: " (Ty)",
  submitBody: "Dziecko przekazało zgłoszenie. Stan: „{to}”.",
  transitionBody: "Zmiana z „{from}” na „{to}”.",
  notePrefix: "Notatka: ",
  separator: " · ",
};

// The new-comment form under the timeline (D-03, D-13). Comments are not idempotent, so the
// network-failure text asks the user to check the timeline before sending again.
export const COMMENT = {
  label: "Nowy komentarz",
  helper:
    "Komentarze widzą rodzic i nauczyciel prowadzący zgłoszenie. Dziecko ich nie widzi. Komentarza nie można później edytować ani usunąć.",
  empty: "Wpisz treść komentarza.",
  counter: "{n}/{max}",
  submit: "Dodaj komentarz",
  pending: "Wysyłanie…",
  added: "Komentarz dodany.",
  networkError:
    "Nie udało się potwierdzić zapisu komentarza. Odśwież zgłoszenie i sprawdź historię, zanim wyślesz komentarz ponownie.",
};

export const ERRORS = {
  networkLoad: "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.",
  retry: "Spróbuj ponownie",
  retrySuffix: " Spróbuj ponownie.",
};

export const NAMES = {
  childFallback: "Dziecko",
};
