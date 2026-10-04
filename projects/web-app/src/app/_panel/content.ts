// Panel copy (02-UI-SPEC.md, Copywriting Contract). All panel-authored text lives here.
// Copy rules: no em dashes, no " - " joining clauses, and nothing that marks the app as a
// presentation build (D-02). Contract labels and API error messages are imported from
// @/lib/contract/types where they are shown and are never copied into this file.
// LOGIN_HREF is not redefined here: import it from "@/app/_landing/links" (never from
// "@/app/_landing/content", which lists the demo accounts and would ship them to the browser).

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
  // The server accepted the login but this browser could not keep the session (blocked or full
  // storage, or a device clock far ahead of the server's).
  sessionNotSaved:
    "Nie udało się zapisać logowania w tej przeglądarce. Zezwól stronie na zapisywanie danych, sprawdź datę w urządzeniu i spróbuj ponownie.",
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

// The "Zmień stan" card on the detail page (D-12). A state is shown only after the server's 201.
export const ACTIONS_CARD = {
  title: "Zmień stan",
  current: "Obecny stan:",
  none: "Na tym etapie nie możesz zmienić stanu zgłoszenia. Możesz dodać komentarz.",
  success: "Zapisano. Obecny stan: {state}.",
  conflict: "Sprawa zmieniła się w międzyczasie. Pokazujemy aktualny stan zgłoszenia.",
  conflictNoteMoved: "Twoja notatka jest w polu nowego komentarza. Nie została wysłana.",
  buttonSuffix: " zgłoszenie",
};

// The transition confirmation dialog (D-12): one title and consequence per action, with the reject
// and reopen variants chosen by the current state.
export const DIALOG = {
  dismiss: "Zostaw bez zmian",
  pending: "Zapisywanie…",
  counter: "{n}/{max}",
  noteOptional: "Komentarz (opcjonalnie)",
  noteRequired: "Do kogo eskalowano (wymagane)",
  escalateEmpty: "Wpisz, do kogo eskalowano zgłoszenie.",
  networkError: "Nie udało się potwierdzić zmiany. Spróbuj ponownie.",
  approve: {
    title: "Zatwierdzić zgłoszenie?",
    body: "Zgłoszenie trafi do wychowawcy klasy dziecka. Nauczyciel zobaczy treść, historię i komentarze.",
  },
  rejectPending: {
    title: "Odrzucić zgłoszenie?",
    body: "Zgłoszenie nie trafi do nauczyciela. Możesz je później zatwierdzić albo wznowić.",
  },
  rejectTeacher: {
    title: "Odrzucić zgłoszenie?",
    body: "Nauczyciel straci dostęp do zgłoszenia, także do historii i komentarzy. Możesz je później zatwierdzić ponownie.",
  },
  escalate: {
    title: "Eskalować zgłoszenie?",
    body: "Zapisz, do kogo przekazujesz sprawę, na przykład CERT Polska (NASK) albo moderatorzy gry. Aplikacja niczego nie wysyła automatycznie.",
  },
  close: {
    title: "Zamknąć zgłoszenie?",
    body: "Zgłoszenie zostanie oznaczone jako zamknięte. Można je później wznowić.",
  },
  reopenClosed: {
    title: "Wznowić zgłoszenie?",
    body: "Zgłoszenie wróci do nauczyciela w stanie „u nauczyciela”.",
  },
  reopenRejected: {
    title: "Wznowić zgłoszenie?",
    body: "Zgłoszenie wróci do stanu „czeka na rodzica”.",
  },
};

export const ERRORS = {
  networkLoad: "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.",
  retry: "Spróbuj ponownie",
  retrySuffix: " Spróbuj ponownie.",
};

export const NAMES = {
  childFallback: "Dziecko",
};
