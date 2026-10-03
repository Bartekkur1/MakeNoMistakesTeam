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

### Wpis historii

Każda zmiana stanu zgłoszenia zapisuje wpis historii (D-10). Historia jest **tylko do dopisywania**: wpisów nie da się edytować ani usuwać. Pierwszy wpis każdego zgłoszenia to `submit` (utworzenie).

| Pole | Typ | Reguły |
|---|---|---|
| `id` | string (UUID) | nadaje backend |
| `report_id` | string (UUID) | zgłoszenie, którego dotyczy wpis |
| `action` | string (enum) | `submit` / `approve` / `reject` / `escalate` / `close` / `reopen` |
| `from_state` | string (enum) \| null | stan przed zmianą; `null` tylko dla `submit` |
| `to_state` | string (enum) | stan po zmianie |
| `actor_id` | string (UUID) | kto wykonał zmianę (dla `submit`: dziecko) |
| `actor_role` | string (enum) | `child` (dziecko) / `parent` (rodzic) / `teacher` (nauczyciel) |
| `comment` | string \| null | opcjonalna notatka, maks. 1000 znaków; wymagana przy `escalate` (do kogo eskalowano) |
| `created_at` | string (ISO 8601 UTC) | czas zmiany; równy `updated_at` zgłoszenia po tej zmianie |

Akcje historii (`action`):

| Wartość | Etykieta PL |
|---|---|
| `submit` | zgłoszenie |
| `approve` | zatwierdź |
| `reject` | odrzuć |
| `escalate` | eskaluj |
| `close` | zamknij |
| `reopen` | wznów |

Szczegóły zgłoszenia zwracają historię w kolejności chronologicznej (najstarszy wpis pierwszy).

### Komentarz

Zgłoszenie ma wątek komentarzy dla **rodzica i nauczyciela** (D-11). Wątek jest **niewidoczny dla dziecka**: token wtyczki (zakres `extension`) nigdy go nie dostaje. Komentarze są tylko do dopisywania — nie da się ich edytować ani usuwać. To nie jest odpowiedź do dziecka.

| Pole | Typ | Reguły |
|---|---|---|
| `id` | string (UUID) | nadaje backend |
| `report_id` | string (UUID) | zgłoszenie, którego dotyczy komentarz |
| `author_id` | string (UUID) | zalogowane konto, które dodało komentarz |
| `author_role` | string (enum) | `parent` / `teacher` |
| `body` | string | po przycięciu spacji niepusty, maks. 2000 znaków; serwer zapisuje wersję przyciętą |
| `created_at` | string (ISO 8601 UTC) | nadaje serwer |

Szczegóły zgłoszenia zwracają komentarze w kolejności chronologicznej (najstarszy pierwszy).

### Konto

Zwracane przez `POST /api/auth/login` i `GET /api/auth/me`.

| Pole | Typ | Reguły |
|---|---|---|
| `id` | string (UUID) | id konta demo |
| `email` | string | e-mail w domenie `bezpiecznaaura.example` |
| `role` | string (enum) | `parent` (rodzic) / `teacher` (nauczyciel) |
| `display_name` | string | fikcyjna nazwa z dopiskiem „(demo)” albo „(smoke)” |

### Dziecko

Zwracane w polu `children` logowania i sesji. Dziecko nie ma konta i się nie loguje.

| Pole | Typ | Reguły |
|---|---|---|
| `id` | string (UUID) | id dziecka demo (= `child_id` zgłoszeń) |
| `display_name` | string | fikcyjne imię z dopiskiem „(demo)” albo „(smoke)” |
| `parent_id` | string (UUID) | rodzic dziecka |
| `class_id` | string | klasa dziecka (`class-5a`, `class-6b`, `class-test`) |

### Wynik testu/misji

| Obiekt | Pola |
|---|---|
| Wynik testu/misji | participant_code, scenario_id, phase (pre / training / post), selected_action, justification, hints_used, score, origin |

Endpointy dla wyników dochodzą w fazie 3 web-app (API-03..05). Ta wersja kontraktu ich nie definiuje.

## Widoczność

Kto co widzi (D-11, D-15):

| Kto | Lista i szczegóły zgłoszeń | Historia i komentarze |
|---|---|---|
| Rodzic (`panel`) | wszystkie zgłoszenia **swojego** dziecka, w każdym stanie | tak, w szczegółach zgłoszenia |
| Rodzic przez wtyczkę (`extension`) | lista zgłoszeń swojego dziecka; **bez** szczegółów | **nigdy** |
| Nauczyciel (`panel`) | pełne zgłoszenia dzieci ze **swoich klas**, tylko w stanach `with_teacher`, `escalated`, `closed` (czyli zatwierdzone przez rodzica) | tak, w szczegółach zgłoszenia |
| Dziecko | nie loguje się; zgłasza przez wtyczkę rodzica | **nigdy** |

- Zgłoszenie w stanie `pending_parent` albo `rejected` jest dla nauczyciela niewidoczne. Gdy rodzic ponownie je odrzuci (`reject` z `with_teacher`), nauczyciel **traci** do niego dostęp — także do historii i komentarzy, które sam wcześniej dodał.
- Zgłoszenie, którego konto nie może zobaczyć, odpowiada **404 `report_not_found`** — tak samo jak nieistniejące. API nie zdradza, że takie zgłoszenie istnieje.
- Szczegóły (`GET /api/reports/{id}`) wymagają zakresu `panel`; token wtyczki dostaje 403 `forbidden`.

## Paginacja

`GET /api/reports` zwraca listę stronami, kursorem (D-16). Nie ma sztywnego limitu całej listy.

- Parametry zapytania: `?limit=&cursor=` oraz opcjonalny filtr `state`. Przykład: `GET /api/reports?limit=20&cursor=<next_cursor>`.
- `limit`: liczba całkowita 1–100, domyślnie 20.
- `cursor`: nieprzezroczysty napis — klient bierze go **dosłownie** z pola `next_cursor` poprzedniej odpowiedzi i niczego w nim nie zmienia.
- Kolejność: `created_at` malejąco (najnowsze pierwsze), przy remisie `id` malejąco. Kolejna strona zaczyna się tuż za ostatnim zgłoszeniem poprzedniej.
- Odpowiedź: `{ "reports": [...], "next_cursor": "..." }`. Na ostatniej stronie `next_cursor` to `null`.
- `state` (`pending_parent` / `rejected` / `with_teacher` / `escalated` / `closed`) zawęża listę do jednego stanu, w granicach widoczności konta.
- Gdy nic nie pasuje do filtra, odpowiedź to 200 z pustą listą `{ "reports": [], "next_cursor": null }`, nigdy 404.
- Zła wartość `limit`, `state` albo uszkodzony `cursor`: 400 `validation_error`.

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
- Przykłady: `shared/examples/post-auth-login.json` (panel), `shared/examples/post-auth-login-extension.json` (wtyczka).

### GET /api/auth/me

Zwraca dane bieżącej sesji (panel i wtyczka sprawdzają nim, czy token jest jeszcze ważny).

- Wymaga `Authorization: Bearer <token>` (zakres `panel` albo `extension`).
- Odpowiedź 200: `{ "expires_at", "scope", "account", "children" }` — te same pola co przy logowaniu, bez tokenu.
- Brak tokenu, uszkodzony albo wygasły token: 401 `unauthorized`.
- Przykład: `shared/examples/get-auth-me.json`.

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

### GET /api/reports

Zwraca stronę listy zgłoszeń widocznych dla zalogowanego konta (panel rodzica i nauczyciela, lista we wtyczce).

- Wymaga `Authorization: Bearer <token>` (zakres `panel` albo `extension`).
- Parametry `?limit=&cursor=&state=` — sekcja „Paginacja”. Widoczność — sekcja „Widoczność”.
- Odpowiedź 200: `{ "reports": [Zgłoszenie, ...], "next_cursor": string | null }`. Zgłoszenia **bez** historii i komentarzy.
- Przykłady: `shared/examples/get-reports.json` (rodzic, pierwsza strona po 2), `shared/examples/get-reports-teacher.json` (nauczyciel).

### GET /api/reports/{id}

Zwraca jedno zgłoszenie razem z historią i komentarzami (panel).

- Wymaga `Authorization: Bearer <token>` z zakresem `panel`. Token wtyczki: 403 `forbidden`.
- Odpowiedź 200: Zgłoszenie z dodatkowymi polami `history` (lista Wpisów historii) i `comments` (lista Komentarzy), obie najstarsze pierwsze.
- Nieznane albo niepoprawne `id` (także nie-UUID) oraz zgłoszenie niewidoczne dla konta: 404 `report_not_found`.
- Przykład: `shared/examples/get-report.json`.

### GET /api/health

- Nie wymaga logowania.
- 200 `{ "status": "ok" }`, gdy baza odpowiada; 503 `storage_unavailable` w przeciwnym razie.
- Widget może go wywołać, żeby pokazać „brak połączenia” (ERR-01).
- Przykład: `shared/examples/get-health.json`.

## Dane demo

Kanoniczne, fikcyjne dane demo są w `shared/examples/demo-dataset.json`: 6 zgłoszeń, 13 wpisów historii i 3 komentarze. **seed.sql powstaje z demo-dataset.json (plan 01-05).** Panel i widget mogą na tych danych pracować, zanim backend będzie dostępny. Wszystkie czasy to 2026-10-03 (UTC).

Stały schemat id (wszystkie to poprawne UUID): prefiks `00000000-0000-4000-8000-0000000`, a po nim:

| Obiekt | Końcówka | Przykład |
|---|---|---|
| konto rodzica | `a000N` | `00000000-0000-4000-8000-0000000a0001` |
| konto nauczyciela | `b000N` | `00000000-0000-4000-8000-0000000b0001` |
| dziecko | `c000N` | `00000000-0000-4000-8000-0000000c0001` |
| zgłoszenie | `d00NN` | `00000000-0000-4000-8000-0000000d0002` |
| wpis historii | `e00RK` (R = nr zgłoszenia, K = nr wpisu) | `00000000-0000-4000-8000-0000000e0023` |
| komentarz | `f00RK` (R = nr zgłoszenia, K = nr komentarza) | `00000000-0000-4000-8000-0000000f0021` |

| Zgłoszenie | Dziecko | Rodzaj ataku | Źródło | Stan | Historia |
|---|---|---|---|---|---|
| R1 `…d0001` | Ola (C1) | `data_request` | gra | `pending_parent` | zgłoszenie 08:05 |
| R2 `…d0002` | Ola (C1) | `phishing` | mail | `closed` | zgłoszenie 08:40 → rodzic zatwierdza 08:52 → nauczycielka eskaluje do CERT Polska (NASK) 09:10 → zamyka 09:40; 2 komentarze |
| R3 `…d0003` | Ola (C1) | `purchase_trap` | SMS | `rejected` | zgłoszenie 09:15 → rodzic odrzuca z wyjaśnieniem 09:30 |
| R4 `…d0004` | Kuba (C2) | `fake_prize` | Discord | `with_teacher` | zgłoszenie 10:30 → rodzic zatwierdza z prośbą o pomoc 10:41 |
| R5 `…d0005` | Zosia (C3) | `impersonation` | gra | `escalated` | zgłoszenie 11:00 → rodzic zatwierdza 11:08 → nauczyciel eskaluje do moderatorów gry i CERT Polska (NASK) 11:25; 1 komentarz |
| R6 `…d0006` | Kuba (C2) | `other` | inne | `pending_parent` | zgłoszenie 11:45 (zaproszenie na warsztaty — niegroźne) |

Przykłady żądań zapisujących (`post-reports.json`, przejścia, komentarze) pokazują **nowe** id i czasy od 12:00 — po wczytaniu danych demo.

## Przykłady

Katalog `.planning/shared/examples/` (zgodność sprawdza `node web-app/scripts/check-contract-examples.mjs`). Każdy plik przykładu ma pola `description`, `method`, `route`, `path`, `auth`, `request`, `response`. Pole `auth` to `null` (bez logowania) albo `{ "email", "scope" }` konta demo, które wysyła żądanie — prawdziwy token nigdy nie trafia do przykładów.

| Plik | Znaczenie |
|---|---|
| `shared/examples/demo-dataset.json` | Kanoniczne dane demo: 6 zgłoszeń z historią i komentarzami (sekcja „Dane demo”); źródło seed.sql. |
| `shared/examples/post-auth-login.json` | Mama Oli loguje się do panelu e-mailem i kodem `0000`; odpowiedź z tokenem, kontem i dzieckiem. |
| `shared/examples/post-auth-login-extension.json` | Mama Oli loguje się we wtyczce (zakres `extension`). |
| `shared/examples/get-auth-me.json` | Wychowawczyni 5a sprawdza sesję; widzi dzieci ze swojej klasy. |
| `shared/examples/post-reports.json` | Wtyczka (konto Mamy Oli, zakres `extension`) tworzy zgłoszenie fałszywej nagrody z gry; odpowiedź 201. |
| `shared/examples/get-reports.json` | Mama Oli listuje zgłoszenia po 2 na stronę; pierwsza strona i `next_cursor`. |
| `shared/examples/get-reports-teacher.json` | Wychowawczyni 5a widzi tylko zgłoszenia zatwierdzone przez rodziców swojej klasy. |
| `shared/examples/get-report.json` | Szczegóły zgłoszenia R2 z pełną historią i dwoma komentarzami. |
| `shared/examples/get-health.json` | Sprawdzenie, czy backend i baza działają. |

## Reguły

- Rodzic widzi tylko zgłoszenia swojego dziecka. Nauczyciel widzi **w pełni** zgłoszenia dzieci ze swoich klas, które rodzic zatwierdził (D-15).
- Wyniki testów nauczyciel widzi tylko w postaci zagregowanej (API-05).
- Dziecko (wtyczka, zakres `extension`) nigdy nie widzi historii ani komentarzy (D-11).
- Backend wylicza `score` według klucza oceny z `shared/content/`; nie przyjmuje punktów od klienta jako prawdy.
- Import wyników z Roblox ma `origin` = roblox; nie mieszać treningu z testem samodzielności.
- Brak wspólnego logowania z Roblox.
- Sekrety nigdy w kliencie (Roblox, rozszerzenie, panel).
