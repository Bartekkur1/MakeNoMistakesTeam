# Phase 2: Panel opiekuna - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-10-03
**Phase:** 2-panel-opiekuna
**Areas discussed:** PAN vs nowy model, Wejście do panelu, Lista spraw, Szczegóły i akcje

---

## PAN vs nowy model

| Option | Description | Selected |
|--------|-------------|----------|
| Logowanie + przycisk zmiany konta | Znaczek "konto demonstracyjne" i "Zmień konto" w nagłówku | |
| Tylko logowanie | Zmiana roli = wyloguj i zaloguj innym kontem | |
| Przełącznik ról bez logowania | Lista ról, panel sam pobiera token | |

**User's choice (PAN-04):** "Normalnie logowanie i wylogowywanie" (free text)

| Option | Description | Selected |
|--------|-------------|----------|
| Tylko stan zgłoszenia | Dziecko we wtyczce widzi stan na liście | |
| Komunikat dla dziecka | Nowe pole i endpoint w backendzie | |
| Strona dziecka poza fazą 2 | Widget albo faza 4 | |

**User's choice (PAN-03):** "Dzieci nie widzą nic i nie logują się do aplikacji, dostęp ma tylko rodzic i nauczyciel" (free text)

| Option | Description | Selected |
|--------|-------------|----------|
| Rodzaj ataku + co dziecko zrobiło | Bez sekcji sygnałów | ✓ |
| To samo + pusta sekcja sygnałów | Wyszarzone "wkrótce" | |

**Notes:** Wcześniej w sesji użytkownik zdecydował, że treść wymagań PAN zostaje bez zmian ("zostawiamy plan tak jak jest"); decyzje zapisano jako interpretację.

---

## Wejście do panelu

| Option | Description | Selected |
|--------|-------------|----------|
| Formularz + lista kont demo | Kliknięcie konta wpisuje e-mail | |
| Sam formularz | E-mail i kod | |
| Dwa kroki jak w produkcji | E-mail, potem ekran kodu | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Zostaje zalogowany | Token do wygaśnięcia (12 h) | ✓ |
| Wylogowuje | Token tylko na czas karty | |

| Option | Description | Selected |
|--------|-------------|----------|
| /panel i /panel/[id] | /login już podlinkowany z landingu | ✓ |
| /zgloszenia i /zgloszenia/[id] | Polskie adresy | |

| Option | Description | Selected |
|--------|-------------|----------|
| Na ekranie kodu + znaczek w panelu | Dopisek o 0000 i znaczek "demo" | |
| Tylko na ekranie kodu | Dopisek o 0000 | |
| Nigdzie | Wygląda jak produkcja | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Przechodzi do kodu, błąd dopiero po kodzie | Nie zdradza istniejących kont | ✓ |
| Błąd od razu w kroku 1 | Nowy endpoint, wyliczanie kont | |

---

## Lista spraw

| Option | Description | Selected |
|--------|-------------|----------|
| Zakładki Nowe / W toku / Zakończone | Znaczenie zależne od roli | |
| Jedna lista z etykietą stanu | Od najnowszej, kolorowa etykieta | ✓ |
| Dwie sekcje: Nowe i Zakończone | Dosłownie PAN-01 | |

**Wiersz (multi):** Rodzaj ataku ✓, Imię dziecka ✓, Znacznik ryzyka ✓, Etykieta stanu ✓

| Option | Description | Selected |
|--------|-------------|----------|
| Przycisk "Pokaż więcej" | Kolejna strona po kursorze | ✓ |
| Przewijanie bez końca | Automatyczne doładowanie | |

---

## Szczegóły i akcje

| Option | Description | Selected |
|--------|-------------|----------|
| Przycisk + okienko z komentarzem | Tylko dozwolone akcje, potwierdzenie | ✓ |
| Od razu po kliknięciu | Okienko tylko przy eskalacji | |

| Option | Description | Selected |
|--------|-------------|----------|
| Jedna oś czasu | Historia i komentarze przeplatane | ✓ |
| Dwie osobne sekcje | Historia, potem wątek | |

| Option | Description | Selected |
|--------|-------------|----------|
| Automatycznie co kilka sekund | Odświeżanie co ~5 s | |
| Przycisk "Odśwież" | Zmiany po kliknięciu | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Komunikat i odświeżenie sprawy | Przy 409 | ✓ |
| Ty zdecyduj | Planner | |

---

## Claude's Discretion

- Wygląd panelu (spójny z landingiem; ewentualnie `/gsd-ui-phase 2`)
- Miejsce przechowywania tokenu w granicach D-07
- Stany puste, ładowania i błędy backendu
- Podział na komponenty klienckie i serwerowe
- Układ na telefonie

## Deferred Ideas

None.
