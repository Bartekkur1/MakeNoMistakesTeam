// Landing page copy, links and demo accounts (spec: docs/superpowers/specs/2026-10-03-landing-design.md).
// All visible text lives here so it can be edited without touching layout.
// Numbers come only from ✅ entries in ideas/defence/research.md and always cite a numbered source.
// Copy rules: no em dashes and no "clause - clause" sentences (tests/landing/content.test.ts).

import { DEMO_ACCOUNTS, DEMO_LOGIN_CODE } from "@/lib/contract/demo-accounts";
import type { AccountInfo, AccountRole } from "@/lib/contract/types";

export { DEMO_LOGIN_CODE };

export const RELEASES_URL = "https://github.com/Bartekkur1/MakeNoMistakesTeam/releases";
export const EXTENSION_DOWNLOAD_URL = `${RELEASES_URL}/latest/download/bezpiecznaaura-wtyczka.zip`;
// Defined in ./links so client components can import it without this module.
export { LOGIN_HREF } from "./links";
// Chrome refuses to open chrome:// pages from a link, so this is shown as text to copy.
export const CHROME_EXTENSIONS_PAGE = "chrome://extensions";

export const SECTION_IDS = {
  howItWorks: "jak-dziala",
  parents: "rodzice",
  schools: "szkoly",
  faq: "pytania",
  install: "instalacja",
} as const;

export const NAV_LINKS = [
  { href: `#${SECTION_IDS.howItWorks}`, label: "Jak działa" },
  { href: `#${SECTION_IDS.parents}`, label: "Rodzice" },
  { href: `#${SECTION_IDS.schools}`, label: "Szkoły" },
  { href: `#${SECTION_IDS.faq}`, label: "Pytania" },
] as const;

export interface Source {
  id: number;
  text: string;
  url: string;
}

// Footnote numbers on the page are these ids, in this order.
export const SOURCES: Source[] = [
  {
    id: 1,
    text: "NASK, badanie „Nastolatki” 2024 (publ. 2025), Polska: 3665 uczniów od 7 klasy szkoły podstawowej do 2 klasy szkoły ponadpodstawowej i 918 rodziców.",
    url: "https://www.nask.pl/media/2025/09/Nastolatki_RAPORT-2.pdf",
  },
  {
    id: 2,
    text: "CERT Orange Polska, „Oszustwa na Robloxie”, wrzesień 2026.",
    url: "https://cert.orange.pl/aktualnosci/oszustwa-na-robloxie/",
  },
  {
    id: 3,
    text: "Lastdrager i in., SOUPS 2017, Holandia.",
    url: "https://www.usenix.org/conference/soups2017/technical-sessions/presentation/lastdrager",
  },
];

export const HERO = {
  title: "Haczyk w wiadomości? Scamerino pomoże go znaleźć.",
  subtitle:
    "Pomocnik w przeglądarce dla dzieci w wieku 10-13 lat. Dziecko wkleja podejrzaną wiadomość z gry, Discorda, SMS-a albo maila, a Scamerino pokazuje sygnały ostrzegawcze i podpowiada, co zrobić. Jeśli trzeba, dziecko jednym kliknięciem przekazuje sprawę Tobie.",
  primaryLabel: "Zainstaluj w Chrome",
  secondaryLabel: "Zobacz, jak to działa",
  imageAlt: "Scamerino Alertinio, niebieski rekin w zbroi z kłódką, z kogutem alarmowym i lupą",
};

export interface StatItem {
  value: string;
  label: string;
}

export interface StatPair {
  first: StatItem;
  second: StatItem;
  sourceId: number;
}

export const STATS = {
  title: "O wielu takich zdarzeniach rodzice się nie dowiadują",
  note: "Badanie objęło uczniów od 7 klasy, czyli trochę starszych niż nasi użytkownicy.",
};

export const STAT_PAIRS: StatPair[] = [
  {
    first: {
      value: "28%",
      label:
        "nastolatków padło ofiarą cyberprzestępstwa, najczęściej włamania na konto e-mail lub w serwisie społecznościowym (12%) albo kradzieży przedmiotów w grach (8%)",
    },
    second: { value: "13%", label: "rodziców potwierdza takie zdarzenie" },
    sourceId: 1,
  },
  {
    first: {
      value: "57%",
      label: "rodziców mówi, że ustala zasady i sprawdza, co dziecko robi w sieci",
    },
    second: { value: "21%", label: "nastolatków to potwierdza" },
    sourceId: 1,
  },
];

export interface ScamExample {
  title: string;
  message: string;
  signals: string[];
  action: string;
}

export const SCAMS_SECTION = {
  title: "Tak wyglądają typowe próby oszustwa",
  intro:
    "Przykłady są zmyślone, ale oparte na schematach opisanych przez CERT Orange Polska. Pod każdym widać sygnały, na które Scamerino zwraca uwagę dziecka.",
  sourceId: 2,
  signalsLabel: "Sygnały",
  actionLabel: "Co zrobić",
  scamLabel: "Oszustwo",
  honestLabel: "Bezpieczna",
};

export const SCAMS: ScamExample[] = [
  {
    title: "Darmowe Robuxy",
    message:
      "Hej! Event 10 000 Robux za darmo tylko dziś. Zaloguj się na robIox-bonus[.]xyz i wpisz kod z SMS, żeby odebrać!",
    signals: ["coś za darmo i link", "pośpiech: tylko dziś", "duże I zamiast l w adresie", "prośba o kod z SMS"],
    action: "Nie klikać. Sprawdzić event w oficjalnej aplikacji gry.",
  },
  {
    title: "Fałszywy moderator",
    message:
      "Jestem z moderacji Roblox. Twoje konto zostanie zbanowane za 10 min. Podaj kod weryfikacyjny, który właśnie dostałeś, żebyśmy mogli to wyjaśnić.",
    signals: ["podszywanie się pod obsługę", "groźba i presja czasu", "prośba o kod weryfikacyjny"],
    action: "Nie podawać kodu. Zakończyć rozmowę i powiedzieć dorosłemu.",
  },
  {
    title: "Wymiana „ty pierwszy”",
    message:
      "Dam ci mojego legendarnego peta za twój miecz. Ale ty wysyłasz pierwszy, bo ja już raz zostałem oszukany.",
    signals: ["wymiana poza oficjalnym systemem", "nacisk na litość"],
    action: "Wymieniać się tylko przez oficjalną wymianę w grze.",
  },
  {
    title: "Przejdźmy na Discorda",
    message:
      "Fajnie się gra! Tu jest za dużo moderacji, napisz do mnie na Discordzie, dam ci tam darmowe itemy. Nie mów rodzicom, to nasza tajemnica.",
    signals: ["przeniesienie rozmowy poza grę", "prezenty od obcej osoby", "prośba o tajemnicę"],
    action: "Nie przechodzić. Powiedzieć zaufanemu dorosłemu.",
  },
  {
    title: "Darmowy render awatara",
    message:
      "Zrobię ci darmowy render 3D twojego awatara! Wyślij mi tylko plik, który pokaże ci przeglądarka po wciśnięciu F12 → Network → Save as HAR.",
    signals: ["coś za darmo w zamian za plik", "instrukcja otwierania narzędzi przeglądarki", "plik pozwala wejść na konto bez hasła"],
    action: "Nigdy nie wysyłać plików z przeglądarki.",
  },
];

export const HONEST_EXAMPLE = {
  title: "Kolega z klasy",
  message: "Hej, tu Ola z 5b, gramy jutro po szkole? Dodaj mnie, mój nick to OlaBuduje.",
  note: "Nie każda wiadomość to oszustwo. Dziecko zna tę osobę i może to potwierdzić w szkole, a nikt nie prosi o hasło ani o tajemnicę. Scamerino uczy też tego, żeby nie panikować bez powodu.",
};

export interface TextPoint {
  title: string;
  text: string;
}

export const HOW_IT_WORKS = {
  title: "Jak działa Scamerino",
  steps: [
    {
      title: "Dziecko dostaje podejrzaną wiadomość",
      text: "W grze, na Discordzie, w mailu albo w SMS-ie.",
    },
    {
      title: "Wkleja ją pomocnikowi",
      text: "Klika Scamerino w przeglądarce i przekazuje tylko to, co samo wybierze.",
    },
    {
      title: "Dostaje wskazówki",
      text: "Pomocnik zadaje kilka krótkich pytań, pokazuje sygnały ostrzegawcze i proponuje następny krok.",
    },
    {
      title: "Może przekazać sprawę Tobie",
      text: "Wystarczy jedno kliknięcie. Odpowiadasz w panelu rodzica.",
    },
  ] satisfies TextPoint[],
  trainingNote:
    "Ta sama postać prowadzi misję w Roblox. Tam dziecko ćwiczy reakcję na oszustwo bez prawdziwego ryzyka.",
};

export const PLUGIN_SCREENSHOT = {
  src: "/landing/plugin-demo.png",
  width: 1783,
  height: 858,
  alt: "Okno pomocnika Scamerino obok czatu na Discordzie. Pomocnik pokazuje, jaką wiadomość dziecko przekaże, i pozwala poprawić tekst przed zatwierdzeniem.",
  caption:
    "Pomocnik w przeglądarce. Dziecko widzi dokładnie, jaką wiadomość przekaże rodzicowi, i samo decyduje, czy ją wysłać.",
};

export const MISSION_VIDEO = {
  src: "/landing/roblox-mission.mp4",
  poster: "/landing/roblox-mission-poster.jpg",
  width: 1058,
  height: 752,
  title: "Misja w Roblox",
  caption:
    "Gracz obiecuje 1500 Robuxów i prosi o login i hasło. Dziecko samo wybiera odpowiedź, a Scamerino jest obok, gdy potrzebna jest pomoc.",
  label: "Nagranie misji w Roblox: rozmowa z graczem, który prosi o login i hasło",
};

export const PARENTS = {
  title: "Co widzisz jako rodzic, a czego nie",
  intro: "Dziecko samo decyduje, co Ci pokazuje.",
  visibleTitle: "Widzisz",
  visible: [
    "Sprawy, które dziecko samo Ci przekazało.",
    "Co dziecko już zrobiło, na przykład czy kliknęło link albo podało dane.",
    "Wątek z nauczycielem, jeśli zgodzisz się przekazać sprawę szkole.",
  ],
  hiddenTitle: "Nie widzisz",
  hidden: [
    "Wiadomości i czatów dziecka.",
    "Historii przeglądania.",
    "Innych aplikacji na komputerze i telefonie.",
  ],
  rules: [
    "Scamerino nigdy nie mówi, że wiadomość jest na pewno bezpieczna. Uczy, jak to sprawdzić.",
    "Pokazanie sprawy Tobie i zgłoszenie jej w grze to dwie osobne decyzje dziecka.",
    "Punkty są za umiejętności, nie za liczbę zgłoszeń. Nie ma rankingów ani kar za proszenie o pomoc.",
  ],
};

export const SCHOOLS = {
  title: "Dla szkół: trening, który da się zmierzyć",
  points: [
    "Gotowa misja w Roblox na lekcję o bezpieczeństwie w sieci.",
    "Test przed misją i po niej, rozwiązywany bez pomocnika. Widzisz zbiorczy wynik klasy: trafne decyzje i fałszywe alarmy.",
    "Sprawy, które rodzic przekaże szkole, prowadzisz w panelu nauczyciela i w razie potrzeby eskalujesz, na przykład do NASK.",
    "Nie widzisz prywatnych spraw dzieci ani indywidualnych wyników testu.",
  ],
};

export const TRAINING_FACT = {
  title: "Dlaczego mierzymy",
  text: "Jednorazowa lekcja działa krótko. W badaniu z Holandii dzieci po szkoleniu antyphishingowym poprawiły wynik o 14%, a po 4 tygodniach wróciły do poziomu sprzed szkolenia.",
  steps: [
    { label: "Przed szkoleniem", value: "punkt wyjścia" },
    { label: "Zaraz po", value: "+14%" },
    { label: "Po 4 tygodniach", value: "jak przed" },
  ],
  sourceId: 3,
};

export interface InstallStep {
  text: string;
  code?: string;
}

const INSTALL_STEPS: InstallStep[] = [
  { text: "Pobierz plik ZIP i rozpakuj go." },
  { text: "W Chrome wpisz w pasku adresu:", code: CHROME_EXTENSIONS_PAGE },
  { text: "Włącz „Tryb dewelopera” przełącznikiem w prawym górnym rogu." },
  { text: "Kliknij „Załaduj rozpakowane” i wskaż rozpakowany folder." },
  { text: "Przypnij ikonę Scamerino na pasku przeglądarki." },
];

export const INSTALL = {
  title: "Zainstaluj Scamerino, zanim przyjdzie następna wiadomość o darmowych Robuxach",
  intro: "Wtyczka jest w wersji testowej, dlatego instaluje się ją ręcznie, bez sklepu Chrome.",
  downloadLabel: "Pobierz wtyczkę (ZIP)",
  releasesLabel: "Wszystkie wersje",
  steps: INSTALL_STEPS,
};

export const PANEL = {
  title: "Panel dla rodziców i nauczycieli",
  text: "Tu odpowiadasz na sprawy przekazane przez dziecko, a nauczyciel widzi wyniki klasy.",
  loginLabel: "Zaloguj się",
  demoTitle: "Konta demo",
  demoCodeLabel: "Kod logowania:",
  demoNote: "Konta i dane demo są fikcyjne.",
};

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ = {
  title: "Pytania rodziców i nauczycieli",
  items: [
    {
      question: "Czy Scamerino powie, że wiadomość jest bezpieczna?",
      answer:
        "Nie daje takiej gwarancji. Pokazuje sygnały ostrzegawcze i podpowiada, jak sprawdzić wiadomość w oficjalnej aplikacji albo na stronie.",
    },
    {
      question: "Co, jeśli dziecko już podało kod albo hasło?",
      answer:
        "Zmieńcie razem hasło do konta i zgłoście sprawę w grze. Scamerino podpowiada dziecku, żeby od razu powiedziało o tym dorosłemu.",
    },
    {
      question: "Co widzi nauczyciel?",
      answer: "Zbiorcze wyniki testów klasy i te sprawy, które rodzic zgodził się przekazać szkole.",
    },
    {
      question: "Na jakich urządzeniach to działa?",
      answer:
        "Wtyczka działa w przeglądarce Chrome na komputerze. Dla telefonów przygotowujemy stronę, na której dziecko wklei treść wiadomości.",
    },
    {
      question: "Dla jakiego wieku jest Scamerino?",
      answer: "Dla dzieci w wieku 10-13 lat.",
    },
    {
      question: "Czy to zastępuje rozmowę z dzieckiem?",
      answer: "Nie. Ułatwia ją, bo dziecko przychodzi z konkretną wiadomością.",
    },
  ] satisfies FaqItem[],
};

export const FOOTER = {
  brand: "BezpiecznaAura",
  team: "Make No Mistakes Team",
  demoNotice: "Wersja demonstracyjna. Dane w panelu są fikcyjne.",
  sourcesTitle: "Źródła",
};

export const ROLE_LABELS: Record<AccountRole, string> = {
  parent: "Rodzic",
  teacher: "Nauczyciel",
};

// Smoke accounts exist only for the live smoke test and are never shown to visitors.
export function presentableDemoAccounts(): AccountInfo[] {
  return DEMO_ACCOUNTS.filter((account) => !account.display_name.includes("(smoke)"));
}
