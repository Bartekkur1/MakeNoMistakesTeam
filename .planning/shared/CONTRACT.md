# Kontrakt integracji

Właściciel: osoba 3. Osoba 2 potwierdza przed implementacją. Źródło: `ideas/defence/taski.md` oraz decyzje D-08…D-18 w `.planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-CONTEXT.md`.

**Status:** wersja 2 — szkic (plan 01-01), do zatwierdzenia przez osobę 2
**Wersja:** 2 (2026-10-03)

Wersja 1 (sprawy i odpowiedzi opiekuna, bez logowania) nie została zatwierdzona i jest wycofana; zastępuje ją model zgłoszeń z decyzji CONTEXT D-08…D-18 opisany poniżej.

Typy i stałe w kodzie: `web-app/src/lib/contract/types.ts` (jedno źródło prawdy dla backendu, panelu i checkera), konta demo: `web-app/src/lib/contract/demo-accounts.ts`. Zgodność przykładów sprawdza `node web-app/scripts/check-contract-examples.mjs` — to wykonywalny model referencyjny tego kontraktu.

## Bazowy URL

| Środowisko | Bazowy URL |
|---|---|
| dev (lokalnie) | `http://localhost:3000` |
| demo (Heroku, https) | wpisuje plan 01-06 po wdrożeniu (D-04) |

Każdy klient (wtyczka i strona mobilna widgetu, panel rodzica i nauczyciela, serwer Roblox) używa wyłącznie tego bazowego URL-a z dopisanym `/api/...`.

## Zasady ogólne

- Treść żądań i odpowiedzi to JSON w UTF-8 (`Content-Type: application/json`). Nazwy pól w snake_case, dokładnie jak w tabelach obiektów poniżej.
- Identyfikatory (`id`, `report_id`, `child_id`, `parent_id`, …) to UUID nadawane przez backend.
- Znaczniki czasu to ISO 8601 w UTC, format `YYYY-MM-DDTHH:mm:ss.sssZ` (np. `2026-10-03T12:30:00.000Z`).
- **Logowanie:** każdy endpoint poza `POST /api/auth/login` i `GET /api/health` wymaga nagłówka `Authorization: Bearer <token>`. Token nigdy nie trafia do URL-a (ani do ścieżki, ani do parametrów zapytania) i nie jest ciasteczkiem.
- **Potwierdzenie zapisu:** tylko odpowiedź 2xx ze zwróconym zapisanym obiektem oznacza, że dane zostały zapisane. Każdy inny status albo błąd sieci oznacza „nie zapisano” — klient nie może wtedy pokazać „wysłano” (widget ERR-01).
- **`POST /api/reports` nie jest idempotentny (D-17):** ponowienie żądania po utraconej odpowiedzi może utworzyć duplikat zgłoszenia. Dlatego widget oferuje tylko ręczne „spróbuj ponownie”, bez automatycznych powtórzeń.
- Klienci rozmawiają tylko z `/api/...`, nigdy nie łączą się z Supabase i nigdy nie dostają klucza Supabase (D-03).
- API to route handlers Next.js w projekcie `web-app/` (D-01), z trwałym zapisem w Supabase (Postgres) (D-02).

## Logowanie demo

Logowanie demo (D-14) działa na sztywno wpisanych, fikcyjnych kontach rodziców i nauczycieli. Dziecko **się nie loguje**.

Przebieg:

1. Rodzic albo nauczyciel podaje e-mail i kod. W teorii kod przychodzi mailem; w demo to zawsze **`0000`** i żaden mail nie jest wysyłany.
2. `POST /api/auth/login` zwraca token, czas jego wygaśnięcia, zakres (`scope`), konto i listę dzieci widocznych dla konta.
3. Klient wysyła token w nagłówku `Authorization: Bearer <token>` przy każdym kolejnym wywołaniu.

Żądanie: `{ "email": "...", "code": "0000", "scope": "panel" | "extension" }`. Pole `scope` jest opcjonalne, domyślnie `"panel"`. E-mail jest porównywany po przycięciu spacji i bez rozróżniania wielkości liter.

Odpowiedź 200: `{ "token", "expires_at", "scope", "account", "children" }` — `account` to Konto, `children` to lista Dzieci (rodzic: jego dziecko; nauczyciel: dzieci z jego klas).

Zakresy (`scope`):

| Wartość | Etykieta PL | Kto | Co może |
|---|---|---|---|
| `panel` | panel rodzica lub nauczyciela | rodzic, nauczyciel | wszystkie endpointy dla swojej roli |
| `extension` | wtyczka na urządzeniu dziecka | tylko rodzic | wyłącznie tworzyć i listować zgłoszenia (`POST /api/reports`, `GET /api/reports`) oraz `GET /api/auth/me` |

- Wtyczkę instaluje rodzic i loguje się w niej **swoim** e-mailem z zakresem `extension`. Zgłoszenie z wtyczki jest więc powiązane z kontem rodzica i z jego dzieckiem demo. Token wtyczki nie daje dostępu do szczegółów, historii ani komentarzy.
- Nauczyciel nie może dostać zakresu `extension` (403 `forbidden`).
- Token jest ważny 12 godzin (`LIMITS.tokenTtlSeconds` = 43200). Po wygaśnięciu każde wywołanie zwraca 401 `unauthorized` i trzeba zalogować się ponownie.
- Nie ma endpointu wylogowania: klient po prostu usuwa token.
- Nieznany e-mail i błędny kod dają **ten sam** błąd 401 `invalid_credentials`, żeby nie zdradzać, które konta istnieją.

### Konta demo

Domena wszystkich kont: `bezpiecznaaura.example`. Kod logowania dla każdego konta: `0000`.

| Klucz | Id | Rola | E-mail | Nazwa | Dziecko / klasy |
|---|---|---|---|---|---|
| P1 | `00000000-0000-4000-8000-0000000a0001` | rodzic | `rodzic.ola@bezpiecznaaura.example` | Mama Oli (demo) | dziecko C1 |
| P2 | `00000000-0000-4000-8000-0000000a0002` | rodzic | `rodzic.kuba@bezpiecznaaura.example` | Tata Kuby (demo) | dziecko C2 |
| P3 | `00000000-0000-4000-8000-0000000a0003` | rodzic | `rodzic.zosia@bezpiecznaaura.example` | Mama Zosi (demo) | dziecko C3 |
| P9 | `00000000-0000-4000-8000-0000000a0009` | rodzic | `rodzic.test@bezpiecznaaura.example` | Rodzic testowy (smoke) | dziecko C9 — **tylko test smoke** |
| T1 | `00000000-0000-4000-8000-0000000b0001` | nauczyciel | `nauczyciel.5a@bezpiecznaaura.example` | Wychowawczyni 5a (demo) | `class-5a` |
| T2 | `00000000-0000-4000-8000-0000000b0002` | nauczyciel | `nauczyciel.6b@bezpiecznaaura.example` | Wychowawca 6b (demo) | `class-6b` |
| T9 | `00000000-0000-4000-8000-0000000b0009` | nauczyciel | `nauczyciel.test@bezpiecznaaura.example` | Nauczyciel testowy (smoke) | `class-test` — **tylko test smoke** |

### Dzieci demo

| Klucz | Id | Nazwa | Rodzic | Klasa |
|---|---|---|---|---|
| C1 | `00000000-0000-4000-8000-0000000c0001` | Ola (demo) | P1 | `class-5a` |
| C2 | `00000000-0000-4000-8000-0000000c0002` | Kuba (demo) | P2 | `class-5a` |
| C3 | `00000000-0000-4000-8000-0000000c0003` | Zosia (demo) | P3 | `class-6b` |
| C9 | `00000000-0000-4000-8000-0000000c0009` | Dziecko testowe (smoke) | P9 | `class-test` — **tylko test smoke** |

### Klasy demo

| Id | Nazwa | Nauczyciel |
|---|---|---|
| `class-5a` | Klasa 5a (demo) | T1 |
| `class-6b` | Klasa 6b (demo) | T2 |
| `class-test` | Klasa testowa (smoke) | T9 — **tylko test smoke** |

Konta P9, T9, dziecko C9 i klasa `class-test` służą wyłącznie do testu smoke na żywym środowisku (plan 01-06). Nie używamy ich w prezentacji. Powiązanie rodzic ↔ nauczyciel wynika z klasy dziecka i jest wpisane na sztywno.

## Obiekty

### Zgłoszenie

| Pole | Typ | Kto ustawia | Reguły |
|---|---|---|---|
| `id` | string (UUID) | serwer | nadaje backend |
| `child_id` | string (UUID) | serwer | dziecko demo zalogowanego rodzica |
| `parent_id` | string (UUID) | serwer | zalogowany rodzic (właściciel tokenu) |
| `attack_type` | string (enum) | klient, **wymagane** | rodzaj ataku, tabela niżej |
| `taken_actions` | string[] (enum) | klient, opcjonalne (domyślnie `[]`) | tylko wartości dozwolone dla `attack_type`; serwer usuwa duplikaty i zapisuje w kolejności kanonicznej; pusta lista = „nic z tych rzeczy” |
| `source` | string (enum) | klient, **wymagane** | skąd przyszła wiadomość, tabela niżej |
| `content` | string | klient, **wymagane** | po przycięciu spacji niepusty, maks. 5000 znaków; serwer zapisuje wersję przyciętą |
| `state` | string (enum) | serwer | przy utworzeniu zawsze `"pending_parent"`; dalej zmienia go tylko `POST /api/reports/{id}/transitions` |
| `created_at` | string (ISO 8601 UTC) | serwer | czas utworzenia |
| `updated_at` | string (ISO 8601 UTC) | serwer | czas ostatniej zmiany stanu; nie wcześniejszy niż `created_at` |

Rodzaj ataku (`attack_type`, D-12):

| Wartość | Etykieta PL |
|---|---|
| `phishing` | fałszywy link lub strona logowania |
| `data_request` | prośba o dane, hasło lub kod |
| `fake_prize` | fałszywa nagroda lub konkurs |
| `purchase_trap` | pułapka zakupowa lub prośba o zapłatę |
| `impersonation` | ktoś podszywa się pod znajomego, szkołę lub firmę |
| `other` | coś innego |

Podjęte działania (`taken_actions`, D-12) — checkboxy wielokrotnego wyboru „co już zrobiłeś?”. Kolejność w tabeli to kolejność kanoniczna. Pusta lista = nic z tych rzeczy.

| Wartość | Etykieta PL |
|---|---|
| `clicked_link` | kliknięcie w link |
| `entered_password` | wpisanie loginu lub hasła |
| `shared_code` | podanie kodu (np. z SMS-a) |
| `shared_personal_data` | podanie danych osobowych (imię, adres, telefon, szkoła) |
| `paid` | zapłata lub podanie danych karty |
| `downloaded_file` | pobranie pliku lub aplikacji |
| `replied` | odpisanie nadawcy |

Które checkboxy widget pokazuje dla danego rodzaju ataku (`ACTIONS_BY_ATTACK_TYPE`). Wartość spoza tej listy daje 400 `validation_error`.

| `attack_type` | `clicked_link` | `entered_password` | `shared_code` | `shared_personal_data` | `paid` | `downloaded_file` | `replied` |
|---|---|---|---|---|---|---|---|
| `phishing` | ✓ | ✓ | | | | ✓ | ✓ |
| `data_request` | | ✓ | ✓ | ✓ | | | ✓ |
| `fake_prize` | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| `purchase_trap` | ✓ | | | ✓ | ✓ | | |
| `impersonation` | ✓ | | ✓ | ✓ | ✓ | | ✓ |
| `other` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Źródło (`source`):

| Wartość | Etykieta PL |
|---|---|
| `game` | gra |
| `email` | mail |
| `sms` | SMS |
| `discord` | Discord |
| `other` | inne |

Stan (`state`, D-08):

| Wartość | Etykieta PL |
|---|---|
| `pending_parent` | czeka na rodzica |
| `rejected` | odrzucone przez rodzica |
| `with_teacher` | u nauczyciela |
| `escalated` | eskalowane |
| `closed` | zamknięte |

Sygnały wykryte przez pomocnika i działanie wybrane w misji są odłożone (D-13) — zgłoszenie ich nie zawiera.

### Wynik testu/misji

| Obiekt | Pola |
|---|---|
| Wynik testu/misji | participant_code, scenario_id, phase (pre / training / post), selected_action, justification, hints_used, score, origin |

Endpointy dla wyników dochodzą w fazie 3 web-app (API-03..05). Ta wersja kontraktu ich nie definiuje.

## Endpointy

| Metoda i ścieżka | Wymagane logowanie | Sukces | Możliwe kody błędów |
|---|---|---|---|
| `POST /api/auth/login` | brak | 200, `{ token, expires_at, scope, account, children }` | `invalid_json` 400, `validation_error` 400, `invalid_credentials` 401, `forbidden` 403, `payload_too_large` 413, `internal_error` 500 |
| `GET /api/auth/me` | Bearer, `panel` lub `extension` | 200, `{ expires_at, scope, account, children }` | `unauthorized` 401, `internal_error` 500 |
| `POST /api/reports` | Bearer, rodzic, `panel` lub `extension` | 201, Zgłoszenie | `invalid_json` 400, `validation_error` 400, `unauthorized` 401, `forbidden` 403, `payload_too_large` 413, `storage_unavailable` 503, `internal_error` 500 |
| `GET /api/reports` | Bearer, rodzic lub nauczyciel, `panel` lub `extension` | 200, `{ reports: [Zgłoszenie, ...], next_cursor }` | `validation_error` 400, `unauthorized` 401, `storage_unavailable` 503, `internal_error` 500 |
| `GET /api/reports/{id}` | Bearer, rodzic lub nauczyciel, tylko `panel` | 200, Zgłoszenie + `history` + `comments` | `unauthorized` 401, `forbidden` 403, `report_not_found` 404, `storage_unavailable` 503, `internal_error` 500 |
| `POST /api/reports/{id}/transitions` | Bearer, rodzic lub nauczyciel, tylko `panel` | 201, `{ report, entry }` | `invalid_json` 400, `validation_error` 400, `unauthorized` 401, `forbidden` 403, `report_not_found` 404, `invalid_transition` 409, `payload_too_large` 413, `storage_unavailable` 503, `internal_error` 500 |
| `POST /api/reports/{id}/comments` | Bearer, rodzic lub nauczyciel, tylko `panel` | 201, Komentarz | `invalid_json` 400, `validation_error` 400, `unauthorized` 401, `forbidden` 403, `report_not_found` 404, `payload_too_large` 413, `storage_unavailable` 503, `internal_error` 500 |
| `GET /api/health` | brak | 200, `{ "status": "ok" }` | `storage_unavailable` 503 |

### POST /api/auth/login

Logowanie demo (sekcja „Logowanie demo”).

- Treść: `{ "email": "...", "code": "0000" }` i opcjonalnie `"scope": "panel" | "extension"` (domyślnie `"panel"`). E-mail maks. 254 znaki, kod maks. 16 znaków.
- Odpowiedź 200: `token` (nieprzezroczysty napis ze znaków `A–Z a–z 0–9 . _ -`), `expires_at` (wydanie + 12 h), `scope`, `account` (Konto) i `children` (lista Dzieci).
- Nieznany e-mail albo kod inny niż `0000`: 401 `invalid_credentials` (ten sam błąd w obu przypadkach).
- Nauczyciel z `"scope": "extension"`: 403 `forbidden`.
- Brak `email` lub `code` albo zła wartość `scope`: 400 `validation_error`.
- Przykład: `shared/examples/post-auth-login.json`.

### POST /api/reports

Tworzy zgłoszenie dziecka (widget: „Pokaż rodzicowi”). Woła je wtyczka zalogowana kontem rodzica (zakres `extension`); rodzic może też utworzyć zgłoszenie z panelu.

- Wymaga `Authorization: Bearer <token>` konta rodzica. Token nauczyciela: 403 `forbidden`.
- Treść: `{ "attack_type", "taken_actions", "source", "content" }` — reguły w tabeli Zgłoszenie. `taken_actions` można pominąć (wtedy `[]`).
- Serwer nigdy nie bierze od klienta `id`, `child_id`, `parent_id`, `state`, `created_at` ani `updated_at`. Nieznane pola w treści są ignorowane.
- Serwer ustawia `parent_id` = zalogowany rodzic, `child_id` = jego dziecko demo, `state` = `"pending_parent"`, `created_at` = `updated_at`, i dopisuje do historii wpis `submit` (aktor: dziecko).
- Odpowiedź 201 zawiera zapisane Zgłoszenie. Dopiero ta odpowiedź jest potwierdzeniem zapisu.
- Błąd walidacji: 400 `validation_error` z listą `details` (pole + komunikat).
- Endpoint **nie jest idempotentny** (D-17): klient nie powtarza go automatycznie.
- Przykład: `shared/examples/post-reports.json`.

### GET /api/health

- Nie wymaga logowania.
- 200 `{ "status": "ok" }`, gdy baza odpowiada; 503 `storage_unavailable` w przeciwnym razie.
- Widget może go wywołać, żeby pokazać „brak połączenia” (ERR-01).
- Przykład: `shared/examples/get-health.json`.

## Przykłady

Katalog `.planning/shared/examples/` (zgodność sprawdza `node web-app/scripts/check-contract-examples.mjs`). Każdy plik przykładu ma pola `description`, `method`, `route`, `path`, `auth`, `request`, `response`. Pole `auth` to `null` (bez logowania) albo `{ "email", "scope" }` konta demo, które wysyła żądanie — prawdziwy token nigdy nie trafia do przykładów.

| Plik | Znaczenie |
|---|---|
| `shared/examples/post-auth-login.json` | Mama Oli loguje się do panelu e-mailem i kodem `0000`; odpowiedź z tokenem, kontem i dzieckiem. |
| `shared/examples/post-reports.json` | Wtyczka (konto Mamy Oli, zakres `extension`) tworzy zgłoszenie fałszywej nagrody z gry; odpowiedź 201. |
| `shared/examples/get-health.json` | Sprawdzenie, czy backend i baza działają. |

## Reguły

- Rodzic widzi tylko zgłoszenia swojego dziecka. Nauczyciel widzi **w pełni** zgłoszenia dzieci ze swoich klas, które rodzic zatwierdził (D-15).
- Wyniki testów nauczyciel widzi tylko w postaci zagregowanej (API-05).
- Dziecko (wtyczka, zakres `extension`) nigdy nie widzi historii ani komentarzy (D-11).
- Backend wylicza `score` według klucza oceny z `shared/content/`; nie przyjmuje punktów od klienta jako prawdy.
- Import wyników z Roblox ma `origin` = roblox; nie mieszać treningu z testem samodzielności.
- Brak wspólnego logowania z Roblox.
- Sekrety nigdy w kliencie (Roblox, rozszerzenie, panel).
