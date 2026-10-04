# Phase 3: Przekazanie opiekunowi i błędy - Context

**Gathered:** 2026-10-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Wtyczka wysyła sprawę do prawdziwego backendu (`POST /api/reports`, kontrakt v2) z ekranu wyniku, po pokazaniu dziecku dokładnie tego, co zostanie wysłane, i po jego potwierdzeniu. Rodzic loguje się we wtyczce przy pierwszym uruchomieniu (dwa kroki jak w web-app, zakres `extension`), a sesja nie kończy się dla użytkownika. Dziecko widzi status swoich zgłoszeń (zamiast nieistniejącej w kontrakcie „odpowiedzi opiekuna”), osobno dostaje instrukcję zgłoszenia na platformie, a każda awaria ma czytelny komunikat bez fałszywego „wysłano”.

Poza zakresem: zmiany kontraktu i backendu, mobilna strona (faza 4), AI i zrzuty ekranu (v2).

</domain>

<decisions>
## Implementation Decisions

### Zasada nadrzędna (uwaga użytkownika)
- **D-00:** Kontrakt **nie zmienia się**. Jedynym źródłem prawdy jest `.planning/shared/CONTRACT.md` (v2) oraz decyzje web-app (01-CONTEXT D-08…D-18, 02-CONTEXT D-05…D-08). Pola, enumy, etykiety PL, limity i kody błędów brać dokładnie z kontraktu / `projects/web-app/src/lib/contract/types.ts` (np. skopiowane stałe w widgecie z odnośnikiem do źródła; widget nie importuje kodu web-app w czasie budowania, chyba że planner wykaże, że to proste i bezpieczne).

### Moment wysyłki i podgląd
- **D-01:** Wysyłka **z ekranu wyniku**. „Zatwierdzam” na podglądzie treści tylko rozpoczyna sprawdzanie (jak w fazie 2). Na wyniku przycisk **„Pokaż opiekunowi”** → ekran podglądu wysyłki → **„Wyślij”** → `POST /api/reports`. Obecny przycisk „Poproś opiekuna o sprawdzenie” (demo w pamięci, `MSG_GUARDIAN_REQUEST`) zostaje zastąpiony tym przebiegiem. **Odwraca** ustalenie z fazy 1 „zatwierdzenie = natychmiastowa wysyłka”. Teksty mówiące, że „wynik sprawdzania zobaczy opiekun” (`guardianNotice`, `howToPrivacy`, `confirmation*`) trzeba poprawić, bo wynik nie jest wysyłany.
- **D-02:** Podgląd wysyłki pokazuje **dokładnie pola żądania z polskimi etykietami**: treść (z dopisanym linkiem, D-07), rodzaj ataku (D-05), „Co już zrobiłeś?” (D-06), źródło (D-07), odbiorca (`account.display_name` zalogowanego rodzica). Do tego zdanie w duchu: „Zobaczy to Twój rodzic. Wynik sprawdzania i Twoje odpowiedzi nie są wysyłane.” Rodzaj, działania i źródło można zmienić na tym ekranie; treść edytuje się wcześniej (istniejący „Edytuj wiadomość”).
- **D-03:** Po 201: potwierdzenie „Wysłano do [odbiorca]” z godziną i statusem „Czeka, aż rodzic zobaczy” (D-14) oraz przyciski „Zamknij” i „Sprawdź nową wiadomość”. **Stan karty zostaje** (wynik w pamięci), a ponowna wysyłka tej samej sprawy jest zablokowana (POST nie jest idempotentny). Potwierdzenie wyłącznie na podstawie 2xx ze zwróconym obiektem.
- **D-04:** Awarie (ERR-01): **rozróżnione komunikaty i ręczne „Spróbuj ponownie”**, podgląd zostaje bez zmian. Brak sieci / 503 `storage_unavailable` → „Nie wysłano — brak połączenia”. 400/413/500 → „Nie wysłano”. Sytuacja, w której żądanie mogło dotrzeć, ale odpowiedź zginęła (błąd sieci po wysłaniu, timeout) → „Nie wiemy, czy dotarło” + wskazówka, by sprawdzić „Moje zgłoszenia” przed ponowieniem. **Bez automatycznych powtórzeń** i **bez** `GET /api/health` przed wysyłką. 401 obsługuje ciche ponowne logowanie (D-10), potem jedno ponowienie tej samej operacji jest dozwolone, bo poprzednie żądanie nie zostało przyjęte. Pusta treść jest już blokowana wcześniej (faza 1) — zachować.

### Pola zgłoszenia
- **D-05:** `attack_type` **wyliczany regułą z odpowiedzi i widoczny na podglądzie jako zaznaczona propozycja do zmiany** (6 wartości z etykietami PL z kontraktu). Proponowana reguła: hasło/kod → `data_request`; nagroda → `fake_prize`; zapłata → `purchase_trap`; „podaje się za firmę lub organizację” → `impersonation`; tylko link z wiadomości → `phishing`; brak sygnałów → `other`. Kolejność priorytetów przy wielu sygnałach ustala planner.
- **D-06:** `taken_actions` jako **checkboxy „Co już zrobiłeś?” na podglądzie**, tylko wartości dozwolone dla wybranego rodzaju (`ACTIONS_BY_ATTACK_TYPE`). Po zmianie rodzaju niedozwolone zaznaczenia znikają. Brak zaznaczeń = `[]` („nic z tych rzeczy”). Ton spokojny, bez oceniania.
- **D-07:** `source` **z nazwy hosta strony** (discord.com → `discord`; Gmail/Outlook/WP Poczta itp. → `email`; roblox.com → `game`; reszta / wklejone → `other`), widoczne jako lista do poprawienia na podglądzie. **Link** (pole z fazy 1) dopisywany na koniec `content` jako „Link: …” (2000 + 2048 znaków mieści się w limicie 5000). Adresu/URL strony **nie wysyłamy**.

### Logowanie rodzica
- **D-08:** Po instalacji (`chrome.runtime.onInstalled`, reason install) otwiera się **karta rozszerzenia z logowaniem** — **takim samym jak w web-app** (`projects/web-app/src/app/_panel/LoginScreen.tsx`): krok 1 tylko e-mail (nic nie wysyła), krok 2 czterocyfrowy kod, jedno `POST /api/auth/login` z `scope: "extension"`, ekran nie podpowiada kodu, ten sam komunikat dla złego e-maila i kodu, okno „Zobacz konta demo” jak w web-app. Wygląd: logo Scamerinio, karta, paleta `assets/scamerino_palette.css`. Po sukcesie: „Zalogowano jako [display_name] — zgłoszenia trafią do Twojego konta”. Ta sama strona służy jako strona opcji (`options_ui`).
- **D-09:** Nauczyciel dostaje 403 `forbidden` przy `extension` — pokazać czytelny komunikat, że wtyczkę loguje rodzic.
- **D-10:** **Sesja się nie kończy** dzięki cichemu ponownemu logowaniu: w `chrome.storage.local` trzymane są token, `expires_at`, konto oraz e-mail i kod podane przy logowaniu. Przy 401 albo po `expires_at` wtyczka sama woła `POST /api/auth/login` (`scope: "extension"`) i ponawia operację. Kontrakt bez zmian; działa tylko dlatego, że kod demo jest stały (AR-01 w `01-SECURITY.md` web-app: logowanie demo nie jest granicą bezpieczeństwa). Token tylko w nagłówku `Authorization`, nigdy w URL ani logach. Zapis danych logowania na dysku nie narusza zasady „treść spraw nie trafia na dysk” — treść nadal tylko w pamięci karty. — **Reversibility:** reversible — przejście na token długoterminowy wymagałoby zmiany w web-app, ale po stronie widgetu to wymiana jednego modułu sesji
- **D-11:** Bez konta (pominięte logowanie albo ciche logowanie zwraca `invalid_credentials`): **sprawdzanie działa w pełni**, a zamiast „Pokaż opiekunowi” jest komunikat „Wtyczka nie jest połączona z kontem rodzica. Poproś rodzica o zalogowanie” i link otwierający stronę logowania. Nigdy fałszywe „wysłano”.
- **D-12:** Strona opcji: „Zalogowano jako …” i **„Wyloguj”** (usuwa token, e-mail i kod; wraca formularz). Bez ochrony PIN-em (demo).
- **D-13:** Bazowy URL **ustalany przy budowaniu, domyślnie demo** `https://bezpieczna-aura.pl`; zmienna przy budowaniu (np. `AURA_API=http://localhost:3000`) przełącza na dev. `host_permissions` dla obu adresów. Bez pola na adres w UI. Wywołania sieciowe z service workera (content script nie dostaje tokenu) — szczegóły ustala planner.

### Status i zgłoszenie na platformie
- **D-14:** HND-03 = **status jako odpowiedź**. W menu rekina nowa pozycja **„Moje zgłoszenia”**: ostatnie 10 zgłoszeń z `GET /api/reports?limit=10` (bez „pokaż więcej”), pobierane przy każdym otwarciu, nic nie zapisywane na dysku. Wiersz: początek treści (~60 znaków), rodzaj ataku, data, status. Teksty statusów spokojne, bez oceny: `pending_parent` „Czeka, aż rodzic zobaczy”; `with_teacher` „Rodzic poprosił o pomoc nauczyciela”; `escalated` „Dorośli zgłosili to dalej”; `closed` „Sprawa zamknięta”; `rejected` „Rodzic zobaczył — porozmawiajcie o tym”. Lista obejmuje wszystkie zgłoszenia dziecka widoczne dla tokenu (także utworzone z panelu). Bez konta: ten sam komunikat co D-11. Błędy listy: czytelny komunikat + „Spróbuj ponownie” (GET można ponawiać).
- **D-15:** HND-02: na wyniku **dwa niezależne przyciski** — „Pokaż opiekunowi” i **„Jak zgłosić na platformie”**. Drugi otwiera krótką instrukcję dopasowaną do źródła (Discord: zgłoś wiadomość; gra/Roblox: zgłoś gracza; mail: oznacz jako phishing/spam; SMS: prześlij na 8080 do CERT Polska; inne: ogólna wskazówka) i **niczego nie wysyła**. Linki i nazwy instytucji spójne z listą „Gdzie zgłosić” w `projects/web-app/src/app/_panel/content.ts` (Dyżurnet, CERT Polska, zgłaszanie w Roblox, FDDS 800 100 100, 112).

### Aktualizacja dokumentów
- **D-16:** Pierwszy plan aktualizuje `.planning/workstreams/widget/REQUIREMENTS.md`: HND-03 → „Dziecko widzi status zgłoszenia (decyzję opiekuna)”; HND-02 → „Pokaż opiekunowi” i instrukcja zgłoszenia na platformie to osobne przyciski na wyniku. Do `.planning/workstreams/web-app/STATE.md` dopisać notatkę: kryterium fazy 4 web-app „opiekun odpowiada, dziecko widzi odpowiedź” w widgecie = status z `GET /api/reports` (bez odpowiedzi do dziecka, zgodnie z D-11 web-app). `CONTRACT.md` bez zmian.

### Ustalenia przeniesione
- Stan sprawdzania i treść tylko w pamięci bieżącej karty; zmiana dokumentu kasuje stan (faza 1 D-12, faza 2 D-09).
- Odczyt strony wyłącznie po działaniu dziecka (faza 1 D-04) — nowe wywołania sieciowe nie mogą wysyłać niczego przed „Wyślij” (poza logowaniem rodzica i listą „Moje zgłoszenia” na żądanie).
- Interfejs po polsku, język dla 9–13 lat, małe okno przy rekinie, paleta Scamerino.
- Workstream widget: implementacja delegowana do Codexa, bez nowych testów automatycznych (istniejące aktualizować tylko gdy zmiana ich dotyka), wynik na osobnej gałęzi, merge po ręcznej akceptacji.

### Claude's Discretion
- Architektura modułu API/sesji (service worker jako jedyne miejsce z tokenem i `fetch`, komunikaty `chrome.runtime`), timeouty i klasyfikacja błędów sieciowych.
- Priorytet reguły `attack_type` przy wielu sygnałach; dokładne listy hostów dla `source`.
- Dokładne teksty komunikatów i instrukcji platform (w granicach D-04, D-14, D-15); układ podglądu w małym oknie.
- Sposób współdzielenia stałych kontraktu (kopia z odnośnikiem vs. generowanie).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Kontrakt API (nie zmieniać)
- `.planning/shared/CONTRACT.md` — v2: logowanie demo i zakres `extension`, obiekt Zgłoszenie, enumy z etykietami PL, `ACTIONS_BY_ATTACK_TYPE`, widoczność, błędy, limity, CORS, „tylko 2xx = zapisano”, brak idempotencji POST
- `.planning/shared/examples/post-auth-login-extension.json` — logowanie wtyczki
- `.planning/shared/examples/post-reports.json` — tworzenie zgłoszenia z wtyczki
- `.planning/shared/examples/get-reports.json` — lista zgłoszeń
- `.planning/shared/examples/errors.json` — koperty wszystkich błędów
- `projects/web-app/src/lib/contract/types.ts` — stałe, enumy, `LIMITS`, `API_ERROR_MESSAGES_PL` (jedno źródło prawdy)
- `projects/web-app/src/lib/contract/demo-accounts.ts` — konta demo

### Decyzje web-app
- `.planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-CONTEXT.md` — D-08…D-18 (obieg, brak odpowiedzi do dziecka D-11, pola D-12, logowanie D-14, D-17)
- `.planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-SECURITY.md` — AR-01 (logowanie demo nie jest zabezpieczeniem)
- `.planning/workstreams/web-app/phases/02-panel-opiekuna/02-CONTEXT.md` — D-05…D-08 (dwuetapowe logowanie, sesja, komunikaty)
- `projects/web-app/src/app/_panel/LoginScreen.tsx`, `OtpInput.tsx`, `DemoAccountsDialog.tsx`, `content.ts` — wzór logowania i lista „Gdzie zgłosić”

### Wymagania i wcześniejsze fazy widgetu
- `.planning/workstreams/widget/REQUIREMENTS.md` — HND-01..03, ERR-01 (HND-02/03 do aktualizacji, D-16)
- `.planning/workstreams/widget/ROADMAP.md` — faza 3, kryteria sukcesu
- `.planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-CONTEXT.md` — D-03, D-04, D-12 (zgoda, prywatność, pamięć karty)
- `.planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-CONTEXT.md` — D-05…D-12 (wynik, poprawianie, stan)
- `.planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-UI-SPEC.md` — kontrakt wizualny okna

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `projects/widget/src/core/integration.js` — `submitCase` / `requestGuardianVerification` przez `chrome.runtime.sendMessage`; punkt podmiany na prawdziwą wysyłkę.
- `projects/widget/src/background/sw.js` — walidacja wiadomości (`isValidCase`, `isValidResult`), bufory w pamięci; tu naturalnie trafia klient API, sesja i ciche logowanie.
- `projects/widget/src/core/case.js` — `buildCase` (content, link, origin, source = hostname, truncated), `MAX_CONTENT` 2000, `MAX_LINK` 2048.
- `projects/widget/src/core/check.js` — odpowiedzi i `RESULT_KEYS` (sygnały) do reguły `attack_type`.
- `projects/widget/src/ui/panel.js` + `strings.pl.js` — ekran wyniku z przyciskiem guardian request, obsługa błędów `guardianRequest*`, menu rekina (miejsce na „Moje zgłoszenia”).
- `projects/widget/src/core/draft.js` — store stanu karty (approved, submitFailed, guardianRequested).

### Established Patterns
- Ścisła walidacja wiadomości w SW (dokładne klucze), komunikaty kontekstu unieważnionego po przeładowaniu rozszerzenia.
- Brak bundlera frameworków: vanilla JS + Shadow DOM, build `projects/widget/build.mjs`.
- Manifest MV3 bez `storage`/`host_permissions` — trzeba dodać `storage`, `host_permissions` dla API, `options_ui`/stronę logowania.

### Integration Points
- `manifest.json` (uprawnienia, strona opcji, onInstalled), `build.mjs` (stała bazowego URL z env, nowa strona HTML).
- Backend: `https://bezpieczna-aura.pl/api/auth/login`, `/api/reports` (POST, GET), CORS `*` z nagłówkiem `Authorization`.

</code_context>

<specifics>
## Specific Ideas

- „Logowanie do konta rodzica takie samo jak w apce webowej na pierwsze uruchomienie pluginu.”
- „Sesja ma się nie kończyć.”
- „Używaj dokumentów GSD z API, żeby utrzymać kontrakt.”
- Konto demo do prób: Mama Oli (`rodzic.ola@bezpiecznaaura.example`, kod `0000`); konta `*.test` tylko do smoke.

</specifics>

<deferred>
## Deferred Ideas

- Pole `link` w kontrakcie i osobna odpowiedź opiekuna dla dziecka — wymagałyby zmiany kontraktu i backendu (web-app); na razie link w treści i status zamiast odpowiedzi.
- Token wtyczki bez wygaśnięcia po stronie backendu — alternatywa dla cichego logowania, gdyby kod przestał być stały.
- Wysyłanie sygnałów/wyniku sprawdzania w zgłoszeniu — odłożone w kontrakcie (D-13 web-app).

</deferred>

---

*Phase: 03-przekazanie-opiekunowi-i-b-dy*
*Context gathered: 2026-10-04*
