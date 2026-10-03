# Kontrakt integracji (minimalny)

Właściciel: osoba 3. Osoba 2 potwierdza przed implementacją. Źródło: `ideas/defence/taski.md`.

**Status:** wersja 1 — oczekuje na zatwierdzenie osoby 2
**Wersja:** 1 (2026-10-03)

Typy i stałe w kodzie: `web-app/src/lib/contract/types.ts` (jedno źródło prawdy dla backendu i panelu). Zgodność przykładów sprawdza `node web-app/scripts/check-contract-examples.mjs`.

## Bazowy URL

| Środowisko | Bazowy URL |
|---|---|
| dev (lokalnie) | `http://localhost:3000` |
| demo (Heroku, https) | wpisuje plan 01-04 po wdrożeniu (D-04) |

Każdy klient (rozszerzenie widgetu, strona mobilna, serwer Roblox) używa wyłącznie tego bazowego URL-a z dopisanym `/api/...`.

## Zasady ogólne

- Treść żądań i odpowiedzi to JSON w UTF-8 (`Content-Type: application/json`). Nazwy pól w snake_case, dokładnie jak w tabelach obiektów poniżej.
- Identyfikatory (`id`, `case_id`) to UUID generowane przez backend.
- Znaczniki czasu to ISO 8601 w UTC, format `YYYY-MM-DDTHH:mm:ss.sssZ` (np. `2026-10-03T12:30:00.000Z`).
- Brak uwierzytelniania: to demo z fikcyjnymi profilami. Nigdy nie wysyłaj prawdziwych danych.
- **Potwierdzenie zapisu:** tylko odpowiedź 201/200 z zwróconym obiektem oznacza, że dane zostały zapisane. Każdy inny status albo błąd sieci oznacza „nie zapisano” — klient nie może wtedy pokazać „wysłano” (widget ERR-01).
- **POST nie jest idempotentny:** ponowienie żądania po utraconej odpowiedzi może utworzyć duplikat sprawy. Dlatego widget oferuje tylko ręczne „spróbuj ponownie”, bez automatycznych powtórzeń.
- Klienci nigdy nie łączą się z Supabase i nigdy nie dostają klucza Supabase (D-03). Rozmawiają tylko z `/api/...`.

## Obiekty

### Sprawa

| Pole | Typ | Wymagane w POST | Reguły |
|---|---|---|---|
| `id` | string (UUID) | nie (nadaje serwer) | generuje backend |
| `demo_child_id` | string | **tak** | 1–64 znaki: litery ASCII, cyfry, `_`, `-` (np. `demo-child-1`) |
| `source` | string (enum) | **tak** | `game` / `email` / `sms` / `discord` / `other` |
| `content` | string | **tak** | po przycięciu spacji niepusty, maks. 5000 znaków |
| `signals` | string[] | nie (domyślnie `[]`) | maks. 20 elementów, każdy niepusty, maks. 200 znaków |
| `selected_action` | string \| null | nie (domyślnie `null`) | niepusty, maks. 200 znaków |
| `already_acted` | string (enum) | nie (domyślnie `"unsure"`) | `no` / `clicked` / `shared_data` / `paid` / `unsure` |
| `status` | string (enum) | nie (nadaje serwer) | przy utworzeniu zawsze `"new"` |
| `created_at` | string (ISO 8601 UTC) | nie (nadaje serwer) | czas utworzenia |
| `updated_at` | string (ISO 8601 UTC) | nie (nadaje serwer) | czas ostatniej zmiany sprawy; nie wcześniejszy niż `created_at` |

`signals` i `selected_action` to krótkie identyfikatory ASCII (np. `prosba_o_kod`, `nie_podaje_kodu`). Kanoniczne listy publikuje `shared/content/` (osoba 4). Dopóki ich nie ma, backend przyjmuje każdy identyfikator mieszczący się w limitach.

Status (`status`):

| Wartość | Etykieta PL |
|---|---|
| `new` | nowa |
| `in_progress` | w rozmowie |
| `closed` | zakończona |

Źródło (`source`):

| Wartość | Etykieta PL |
|---|---|
| `game` | gra |
| `email` | mail |
| `sms` | SMS |
| `discord` | Discord |
| `other` | inne |

Czy dziecko już coś zrobiło (`already_acted`) — odpowiedź na pytanie „Czy już kliknąłeś, podałeś dane lub zapłaciłeś?”. To jedna wartość: dziecko wybiera najpoważniejszą, która pasuje.

| Wartość | Etykieta PL |
|---|---|
| `no` | nic z tych rzeczy |
| `clicked` | kliknięcie linku |
| `shared_data` | podanie danych |
| `paid` | zapłata |
| `unsure` | nie wiem |

### Odpowiedź

| Pole | Typ | Reguły |
|---|---|---|
| `id` | string (UUID) | generuje backend |
| `case_id` | string (UUID) | id sprawy, do której należy odpowiedź |
| `message` | string | po przycięciu spacji niepusty, maks. 2000 znaków |
| `created_at` | string (ISO 8601 UTC) | nadaje serwer |

### Wynik testu/misji

| Obiekt | Pola |
|---|---|
| Wynik testu/misji | participant_code, scenario_id, phase (pre / training / post), selected_action, justification, hints_used, score, origin |

Endpointy dla wyników dochodzą w fazie 3 web-app (API-03..05). Ta wersja kontraktu ich nie definiuje.

## Endpointy

| Metoda i ścieżka | Sukces | Możliwe kody błędów |
|---|---|---|
| `POST /api/cases` | 201, Sprawa | `invalid_json` 400, `validation_error` 400, `payload_too_large` 413, `storage_unavailable` 503, `internal_error` 500 |
| `GET /api/cases` | 200, `{ "cases": [Sprawa, ...] }` | `validation_error` 400, `storage_unavailable` 503, `internal_error` 500 |
| `GET /api/cases/{id}` | 200, Sprawa + `replies` | `case_not_found` 404, `storage_unavailable` 503, `internal_error` 500 |
| `PATCH /api/cases/{id}` | 200, Sprawa | `invalid_json` 400, `validation_error` 400, `payload_too_large` 413, `case_not_found` 404, `storage_unavailable` 503, `internal_error` 500 |
| `POST /api/cases/{id}/replies` | 201, Odpowiedź | `invalid_json` 400, `validation_error` 400, `payload_too_large` 413, `case_not_found` 404, `storage_unavailable` 503, `internal_error` 500 |
| `GET /api/health` | 200, `{ "status": "ok" }` | `storage_unavailable` 503 |

### POST /api/cases

Tworzy sprawę (widget: „Pokaż opiekunowi”).

- Treść: obiekt JSON z polami `demo_child_id`, `source`, `content` (wymagane) oraz opcjonalnie `signals`, `selected_action`, `already_acted` — reguły w tabeli Sprawa. Brakujące pola opcjonalne dostają wartości domyślne.
- Nieznane pola w treści są ignorowane. Serwer nigdy nie bierze od klienta `id`, `status`, `created_at` ani `updated_at`.
- Odpowiedź 201 zawiera zapisaną Sprawę ze `status` = `"new"` i `created_at` = `updated_at`. Dopiero ta odpowiedź jest potwierdzeniem zapisu.
- Błąd walidacji: 400 `validation_error` z listą `details` (pole + komunikat).
- Przykład: `shared/examples/post-cases.json`.

### GET /api/cases

Zwraca listę spraw (panel opiekuna).

- Opcjonalne parametry zapytania: `demo_child_id` (ten sam wzorzec co pole Sprawy) i `status` (`new` / `in_progress` / `closed`). Można je łączyć.
- Niepoprawna wartość parametru zwraca 400 `validation_error`.
- Odpowiedź 200: `{ "cases": [...] }` — Sprawy **bez** `replies`, najnowsza pierwsza (`created_at` malejąco, przy remisie `id` malejąco), maksymalnie 200 pozycji.
- Gdy nic nie pasuje do filtra, odpowiedź to 200 z pustą tablicą `{ "cases": [] }`, nigdy 404.
- Panel filtruje po `demo_child_id=demo-child-1` (fikcyjne dziecko demo).
- Przykład: `shared/examples/get-cases.json`.

### GET /api/cases/{id}

Zwraca jedną sprawę razem z odpowiedziami opiekuna.

- Odpowiedź 200: Sprawa z dodatkowym polem `replies` (tablica Odpowiedzi, **najstarsza pierwsza**; pusta tablica, gdy brak odpowiedzi).
- Nieznane albo niepoprawne `id` (także nie-UUID) zwraca 404 `case_not_found`.
- Dziecko czyta odpowiedź opiekuna, odpytując ten adres co 10–15 s, dopóki widok sprawy jest otwarty (widget HND-03).
- Przykład: `shared/examples/get-case.json`.

### PATCH /api/cases/{id}

Zmienia status sprawy (panel opiekuna).

- Treść: `{ "status": "new" | "in_progress" | "closed" }` — dowolna z trzech wartości.
- Przejście nowa → w rozmowie → zakończona to konwencja interfejsu. Backend przyjmuje **każde** przejście, także ponowne otwarcie zakończonej sprawy, żeby dało się zresetować demo.
- Wysłanie obecnego statusu jeszcze raz też zwraca 200.
- `updated_at` zmienia się przy każdym udanym PATCH.
- Odpowiedź 200: Sprawa bez `replies`.
- Błędy: 400 (`invalid_json`, `validation_error`), 404 `case_not_found`, 503 `storage_unavailable`.
- Przykład: `shared/examples/patch-case.json`.

### POST /api/cases/{id}/replies

Dodaje odpowiedź opiekuna do sprawy.

- Treść: `{ "message": "..." }` — po przycięciu spacji niepusta, maks. 2000 znaków. Serwer zapisuje wersję przyciętą.
- Odpowiedź 201: Odpowiedź (obiekt z `id`, `case_id`, `message`, `created_at`).
- Dodanie odpowiedzi **nie zmienia** statusu sprawy. Panel zmienia status osobno, przez PATCH.
- Nieznane albo niepoprawne `id` sprawy zwraca 404 `case_not_found`.
- Przykład: `shared/examples/post-case-replies.json`.

### GET /api/health

- 200 `{ "status": "ok" }`, gdy baza odpowiada; 503 `storage_unavailable` w przeciwnym razie.
- Widget może go wywołać, żeby pokazać „brak połączenia” (ERR-01).
- Przykład: `shared/examples/get-health.json`.

## Błędy

Każdy błąd ma tę samą kopertę:

```json
{ "error": { "code": "validation_error", "message": "Niepoprawne dane — szczegóły w polu details.", "details": [ { "field": "content", "message": "Treść nie może być pusta." } ] } }
```

`details` (lista obiektów `field` + `message`) pojawia się tylko przy `validation_error`.

| Kod | HTTP | Znaczenie | `message` |
|---|---|---|---|
| `invalid_json` | 400 | treść żądania nie jest obiektem JSON | Treść żądania nie jest poprawnym obiektem JSON. |
| `validation_error` | 400 | pola lub parametry zapytania łamią reguły kontraktu | Niepoprawne dane — szczegóły w polu details. |
| `payload_too_large` | 413 | treść żądania większa niż 32 KB | Żądanie jest za duże (limit 32 KB). |
| `case_not_found` | 404 | sprawa o tym `id` nie istnieje (także niepoprawne `id`) | Nie znaleziono sprawy. |
| `storage_unavailable` | 503 | baza niedostępna; nic nie zostało zapisane ani potwierdzone | Nie udało się zapisać ani odczytać danych — baza jest niedostępna. Nic nie zostało potwierdzone, spróbuj ponownie. |
| `internal_error` | 500 | nieoczekiwany błąd serwera | Wystąpił nieoczekiwany błąd serwera. |

Nieobsługiwana metoda HTTP (np. `DELETE`) dostaje 405 bezpośrednio od Next.js, bez treści JSON.

Przykłady wszystkich kodów: `shared/examples/errors.json`.

## Limity

Te same wartości są w `LIMITS` w `web-app/src/lib/contract/types.ts`.

| Limit | Wartość | Przekroczenie |
|---|---|---|
| Rozmiar treści żądania | 32 KB (32768 bajtów) | 413 `payload_too_large` |
| `demo_child_id` | 1–64 znaki `[A-Za-z0-9_-]` | 400 `validation_error` |
| `content` | maks. 5000 znaków, niepusty | 400 `validation_error` |
| `signals` | maks. 20 elementów, każdy maks. 200 znaków | 400 `validation_error` |
| `selected_action` | maks. 200 znaków | 400 `validation_error` |
| `message` (Odpowiedź) | maks. 2000 znaków, niepusty | 400 `validation_error` |
| Lista `GET /api/cases` | maks. 200 spraw | lista jest przycinana (najnowsze) |

## CORS

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
- `Access-Control-Max-Age: 86400`
- Bez credentials (brak ciasteczek i nagłówka `Authorization`).

Każda odpowiedź ma te nagłówki, także odpowiedzi z błędem. Każda ścieżka odpowiada na `OPTIONS` (preflight) statusem 204. To obejmuje wywołania z rozszerzenia (`chrome-extension://...`) i ze strony mobilnej.

## Przykłady

Katalog `.planning/shared/examples/` (zgodność sprawdza `node web-app/scripts/check-contract-examples.mjs`):

| Plik | Znaczenie |
|---|---|
| `shared/examples/post-cases.json` | Widget tworzy sprawę z gry; odpowiedź 201 z zapisaną Sprawą. |
| `shared/examples/get-cases.json` | Lista pięciu spraw `demo-child-1`, najnowsza pierwsza. |
| `shared/examples/get-case.json` | Szczegóły sprawy z dwiema odpowiedziami opiekuna. |
| `shared/examples/patch-case.json` | Opiekun zmienia status sprawy na „w rozmowie”. |
| `shared/examples/post-case-replies.json` | Opiekun dodaje odpowiedź; status sprawy się nie zmienia. |
| `shared/examples/get-health.json` | Sprawdzenie, czy backend i baza działają. |
| `shared/examples/errors.json` | Po jednej odpowiedzi dla każdego kodu błędu. |

Pięć spraw z `get-cases.json` to jednocześnie dane seed bazy (plan 01-03). Panel i widget mogą na nich pracować, zanim backend będzie dostępny.

Stały schemat id w danych demo: sprawy `5e1a0c1e-0000-4000-8000-00000000000N`, odpowiedzi `5e1a0c1e-0000-4000-8000-0000000000aN`.

## Bezpieczeństwo i dane demo

- Brak uwierzytelniania. Przełączanie ról (dziecko / opiekun) jest demonstracyjne i nie jest zabezpieczeniem. To API nie chroni danych prawdziwych dzieci i nie wolno go do tego używać.
- Tylko dane fikcyjne: fikcyjne profile, treści i linki (domeny `.example`).
- Klucz Supabase jest wyłącznie w zmiennych środowiskowych serwera (lokalnie i na Heroku). Nigdy w kliencie.
- Logi serwera nigdy nie zawierają treści spraw ani tekstu odpowiedzi.

## Reguły

- Backend wylicza `score` według klucza oceny z `shared/content/`; nie przyjmuje punktów od klienta jako prawdy.
- Import wyników z Roblox ma `origin` = roblox; nie mieszać treningu z testem samodzielności.
- Brak wspólnego logowania z Roblox. Demo używa fikcyjnych profili dziecka i opiekuna; przełączanie ról jest demonstracyjne, nie zabezpieczeniem.
- Widok nauczyciela nie zwraca prywatnych spraw.
- Sekrety nigdy w kliencie (Roblox, rozszerzenie).
