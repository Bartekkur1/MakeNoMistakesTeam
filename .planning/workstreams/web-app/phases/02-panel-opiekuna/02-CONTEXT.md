# Phase 2: Panel opiekuna - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Panel webowy dla rodzica i nauczyciela w istniejącym projekcie `web-app/` (Next.js 16, React 19, Tailwind 4): logowanie demo, lista zgłoszeń, szczegóły zgłoszenia z historią i komentarzami oraz zmiana stanu. Panel woła wyłącznie API z fazy 1 (`/api/auth/*`, `/api/reports*`) tokenem zakresu `panel`; backend jest gotowy i wdrożony (https://bezpieczna-aura.pl).

Wymagania PAN-01..PAN-04 i kryteria sukcesu fazy w ROADMAP.md pozostają bez zmian w treści (decyzja użytkownika: "zostawiamy plan tak jak jest"). Opisują one stary model (sygnały, odpowiedź widoczna u dziecka, przełączanie ról); sekcja "Interpretacja wymagań" poniżej mówi, jak planner i weryfikator mają je czytać po decyzjach z fazy 1 (D-08..D-15 w `01-CONTEXT.md`).

Poza fazą: cokolwiek po stronie dziecka (dziecko nie loguje się do aplikacji), nowe endpointy backendu, test przed-po i wyniki (faza 3).

</domain>

<decisions>
## Implementation Decisions

### Interpretacja wymagań PAN wobec modelu z fazy 1
- **D-01 (PAN-04, kryterium 4):** Zamiast "przełączania ról" jest **zwykłe logowanie i wylogowanie** kontem demo. Nie ma przełącznika ról ani przycisku "zmień konto" - zmiana roli = wyloguj się i zaloguj innym kontem.
- **D-02 (PAN-04, kryterium 4):** **Interfejs nigdzie nie oznacza demo** (brak znaczka "demo", brak podpowiedzi o kodzie `0000`, brak listy kont demo). Panel wygląda jak produkcja; prowadzący zna konta i kod ze scenariusza prezentacji. To świadomie zastępuje "oznaczone jako demonstracyjne" z PAN-04 i kryterium 4 - weryfikator ma to traktować jako decyzję użytkownika, nie lukę.
- **D-03 (PAN-03, kryterium 3):** **Dzieci nie widzą niczego i nie logują się do aplikacji**; dostęp ma tylko rodzic i nauczyciel. "Odpowiedź" opiekuna = komentarz w wątku rodzic-nauczyciel (D-11 z fazy 1) + zmiana stanu. Kryterium 3 ("widoczne po stronie dziecka") weryfikujemy jako: komentarz i zmiana stanu zrobione przez jedną stronę są widoczne dla drugiej strony (rodzic <-> nauczyciel) w panelu. Panel nie buduje żadnego widoku dla dziecka.
- **D-04 (PAN-02, kryterium 2):** Szczegóły pokazują treść, źródło, **rodzaj ataku** i **zaznaczone `taken_actions` jako "co dziecko już zrobiło"**; ryzykowne działania (kliknięcie, podanie danych, zapłata) są wyróżnione. To jest odpowiedź na pytanie "czy już kliknąłeś, podałeś dane lub zapłaciłeś". **Bez sekcji sygnałów** (sygnały odłożone, D-13 fazy 1) - także bez pustego miejsca na nie.

### Wejście do panelu
- **D-05:** Logowanie w **dwóch krokach jak w produkcji**: najpierw e-mail, potem ekran "wpisz kod" (w demo kod to `0000`, ale ekran tego nie mówi - D-02). Backend ma jedno wywołanie `POST /api/auth/login` (e-mail + kod + `scope: "panel"`); krok 1 tylko zbiera e-mail.
- **D-06:** Nieznany e-mail w kroku 1 **przechodzi do kroku 2**; błąd pojawia się dopiero po wpisaniu kodu, ten sam dla złego maila i złego kodu (nie zdradzamy, które konta istnieją; backend już zwraca identyczne odpowiedzi). Bez nowego endpointu do sprawdzania maila.
- **D-07:** Sesja **przetrwa zamknięcie karty**: token trzymany w przeglądarce do wygaśnięcia (12 h, `LIMITS.tokenTtlSeconds`). Po wygaśnięciu albo przy 401 z API panel wraca na `/login` z komunikatem.
- **D-08:** Adresy: **`/login`** (landing już tam linkuje - `LOGIN_HREF` w `_landing/content.ts`), **`/panel`** (lista), **`/panel/[id]`** (szczegóły). Wejście na `/panel*` bez ważnego tokenu przekierowuje na `/login`. Wylogowanie dostępne w panelu.

### Lista zgłoszeń (`/panel`)
- **D-09:** **Jedna lista** od najnowszego zgłoszenia, bez zakładek; każdy wiersz ma **kolorową etykietę stanu** (`REPORT_STATE_LABELS_PL`). Wymóg PAN-01 "nowe i zakończone" spełniają etykiety stanu. Ewentualny filtr stanu - do uznania plannera (API ma `?state=`).
- **D-10:** Wiersz pokazuje: **datę, źródło, krótki opis** (początek treści), **etykietę stanu, rodzaj ataku, imię dziecka** (z `DEMO_CHILDREN` po `child_id`) i **znacznik ryzyka**, gdy `taken_actions` zawiera kliknięcie, podanie danych lub zapłatę.
- **D-11:** Paginacja przyciskiem **"Pokaż więcej"** (kolejna strona po `next_cursor` doklejana pod listą), bez przewijania bez końca.

### Szczegóły i akcje (`/panel/[id]`)
- **D-12:** Widoczne są **tylko akcje dozwolone dla roli i stanu** (`availableActions(state, role)` z `workflow.ts`). Kliknięcie otwiera **okienko z polem komentarza i przyciskiem potwierdzenia**; komentarz opcjonalny, a przy **eskalacji obowiązkowy** (do kogo eskalowano - `TRANSITION_COMMENT_REQUIRED`).
- **D-13:** Historia zmian stanu i komentarze na **jednej osi czasu**, chronologicznie przeplatane; każdy wpis z autorem, rolą i czasem. Pole nowego komentarza pod osią.
- **D-14:** **Bez automatycznego odświeżania** - przycisk **"Odśwież"** na liście i w szczegółach (oraz przeładowanie strony). Zmiany drugiej strony widać po kliknięciu.
- **D-15:** Przy **409** (ktoś zmienił stan w międzyczasie) panel pokazuje komunikat "sprawa zmieniła się w międzyczasie" i pobiera aktualną sprawę z nowymi przyciskami.

### Claude's Discretion
- Wygląd panelu: spójny z landingiem (fonty Unbounded/Atkinson z `layout.tsx`, kolory z `globals.css`, przyciski z `_landing/styles.ts`); szczegóły może doprecyzować `/gsd-ui-phase 2`.
- Gdzie dokładnie trzymać token (localStorage vs cookie ustawiane przez klienta) - w granicach D-07 i kontraktu (Bearer w nagłówku, bez tokenów w URL).
- Stany puste, ładowania i błędy backendu (503 `storage_unavailable` itd.) - komunikaty z kontraktu, bez fałszywego potwierdzenia zapisu.
- Komponenty klienckie vs serwerowe w Next.js; panel nie importuje nic z `src/lib/server/*` (sekrety zostają na serwerze).
- Układ na telefonie - responsywnie, bez osobnych wymagań.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Kontrakt i model danych
- `.planning/shared/CONTRACT.md` - endpointy, kody błędów, zakresy tokenów, bazowy URL demo
- `.planning/shared/examples/` - przykładowe odpowiedzi JSON (lista rodzica/nauczyciela, szczegóły, przejścia, komentarze)
- `web-app/src/lib/contract/types.ts` - stany, etykiety PL, `TRANSITIONS`, `TRANSITION_COMMENT_REQUIRED`, `TAKEN_ACTIONS`, `ATTACK_TYPES`, `LIMITS`
- `web-app/src/lib/contract/workflow.ts` - `availableActions`, `resolveTransition` (do pokazywania tylko dozwolonych przycisków)
- `web-app/src/lib/contract/demo-accounts.ts` - konta, dzieci i klasy demo (imiona dzieci po `child_id`)

### Decyzje wcześniejsze
- `.planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-CONTEXT.md` - D-08..D-15 (obieg, historia, wątek niewidoczny dla dziecka, logowanie demo, widoczność nauczyciela)
- `.planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-SECURITY.md` - AR-01 (logowanie demo nie jest granicą bezpieczeństwa; brak prawdziwych danych)
- `.planning/workstreams/web-app/REQUIREMENTS.md` - PAN-01..PAN-04 (czytać razem z D-01..D-04 powyżej)
- `.planning/workstreams/web-app/ROADMAP.md` - cel i kryteria fazy 2

### Istniejący frontend
- `web-app/src/app/layout.tsx`, `web-app/src/app/globals.css`, `web-app/src/app/_landing/styles.ts`, `web-app/src/app/_landing/content.ts` (`LOGIN_HREF = "/login"`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `availableActions(state, role)` - gotowa logika, które przyciski pokazać.
- Etykiety PL (`REPORT_STATE_LABELS_PL`, `ATTACK_TYPE_LABELS_PL`, `TAKEN_ACTION_LABELS_PL`, `REPORT_SOURCE_LABELS_PL`, `ACCOUNT_ROLE_LABELS_PL`, `HISTORY_ACTION_LABELS_PL`) - bez tłumaczeń w panelu.
- `DEMO_CHILDREN` / `findDemoAccountById` - imiona dzieci i autorów wpisów (tylko dane fikcyjne, plik bez sekretów).
- Style landingu: tokeny kolorów (`--color-shark-blue`, `--color-hook-crimson`, `--color-siren-amber` itd.), `primaryButton`, `buttonSmall`.

### Established Patterns
- Typy kontraktu to "erasable TypeScript" współdzielone z checkerem - panel je importuje, nie kopiuje.
- Błędy API mają jednolitą kopertę `{ error: { code, message } }`; komunikaty PL pochodzą z kontraktu.
- `src/lib/server/*` jest tylko serwerowe (Supabase, sekrety) - panel go nie importuje.

### Integration Points
- `GET /api/auth/me`, `POST /api/auth/login` (scope `panel`), `GET /api/reports?limit=&cursor=&state=`, `GET /api/reports/[id]`, `POST /api/reports/[id]/transitions`, `POST /api/reports/[id]/comments`.
- Landing linkuje "Zaloguj się" na `/login` (`SiteHeader.tsx`, `Install.tsx`).
- Ten sam projekt i domena co API, więc bez CORS dla panelu.

</code_context>

<specifics>
## Specific Ideas

- Demo pokazuje przebieg na dwóch oknach (rodzic i nauczyciel); zmiany drugiej strony widać po "Odśwież".
- Logowanie ma wyglądać jak produkcja (dwa kroki, bez podpowiedzi demo).

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 02-panel-opiekuna*
*Context gathered: 2026-10-03*
