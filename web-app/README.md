# web-app - backend API zgłoszeń

Aplikacja Next.js z backendem zgłoszeń (wtyczka, strona mobilna, panel rodzica i nauczyciela, serwer Roblox) oraz logowaniem demo (e-mail + kod `0000`).

- Kontrakt API: `.planning/shared/CONTRACT.md` (endpointy, pola, błędy, konta demo, bazowy URL).
- Zgodność przykładów z kontraktem sprawdza `node web-app/scripts/check-contract-examples.mjs`.

## Wymagania

- Node 22.x (`engines` w `package.json`; supabase-js wymaga Node 22+).
- Projekt Supabase z zastosowanym schematem i danymi demo (sekcja "Baza danych").

## Konfiguracja

Serwer potrzebuje trzech zmiennych, wyłącznie po stronie serwera:

| Zmienna | Znaczenie |
|---|---|
| `SUPABASE_URL` | adres projektu Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | klucz serwisowy (service_role / secret), nigdy klucz publiczny anon |
| `DEMO_AUTH_SECRET` | sekret do podpisywania tokenów demo, co najmniej 32 znaki, np. `openssl rand -hex 32` |

- Lokalnie: ustawia je człowiek w pliku `web-app/.env.local` (plik jest ignorowany przez git, wzorzec `.env*`).
- Na Heroku: jako Config Vars aplikacji.
- Nigdy nie trafiają do klienta (wtyczka, strona, panel) ani do zmiennych z prefiksem widocznym w przeglądarce. Nie commitujemy ich i nie wklejamy do dokumentacji.

Bez skonfigurowanej bazy `GET /api/health` odpowiada `503 storage_unavailable`, a serwer działa dalej.

## Baza danych

W edytorze SQL Supabase (SQL Editor) uruchom w całości, w tej kolejności:

1. migracje z `supabase/migrations/` w kolejności nazw plików:
   - `20261003170000_reports.sql`
   - `20261003170100_report_transitions.sql`
   - `20261003170200_append_only_guards.sql` - blokuje usuwanie i `TRUNCATE` historii i komentarzy; usunięcie zgłoszenia nadal kasuje je kaskadowo (z tego korzysta `seed.sql`)
2. `supabase/seed.sql`.

Migracje można też zastosować przez `supabase db push` (po `supabase link`). `seed.sql` to dane demo, które można uruchamiać wielokrotnie - przywraca sześć zgłoszeń demo do stanu początkowego. Po zmianie zbioru danych demo generuje się go ponownie przez `npm run seed:build`.

## Skrypty

| Skrypt | Działanie |
|---|---|
| `npm run dev` | serwer deweloperski na http://localhost:3000 |
| `npm run build` | build produkcyjny |
| `npm start` | serwer produkcyjny na porcie `$PORT` (domyślnie 3000) |
| `npm test` | testy jednostkowe (vitest) |
| `npm run typecheck` | sprawdzenie typów TypeScript |
| `npm run lint` | ESLint |
| `npm run smoke` | test dymny na żywym backendzie (sekcja niżej) |
| `npm run seed:build` | generuje `supabase/seed.sql` ze zbioru danych demo |
| `npm run seed:check` | sprawdza, czy `supabase/seed.sql` jest aktualny |

Testy działają bez bazy danych - używają atrapy klienta supabase-js.

## Test dymny

`npm run smoke` przechodzi cały obieg na żywym backendzie: health, CORS z originu `chrome-extension://`, logowanie demo, utworzenie zgłoszenia, lista, szczegóły, zatwierdzenie, komentarz, eskalacja, zamknięcie, ponowne otwarcie, historia, widoczność dla innych kont i obecność danych demo. Każdy krok wypisuje `PASS <krok>` albo `FAIL <krok>: <powód>`, a ostatnia linia to `SMOKE OK (<url>)` albo `SMOKE FAILED (<url>)`.

- `SMOKE_BASE_URL` - adres backendu (domyślnie `http://localhost:3000`), np. `SMOKE_BASE_URL=https://<aplikacja>.herokuapp.com npm run smoke`.
- `SMOKE_VERIFY_ID` - tryb trwałości: sprawdza tylko, czy zgłoszenie o tym id (z linii `PASS create-report <id>`) przetrwało restart serwera; wynik `PERSIST OK <id>` albo `PERSIST FAILED <id>: <powód>`.
- Zapisuje wyłącznie kontami testowymi: `rodzic.test@bezpiecznaaura.example` i `nauczyciel.test@bezpiecznaaura.example` (klasa `class-test`). Konto `rodzic.ola@bezpiecznaaura.example` jest używane tylko do odczytu. Konta `*.test` nie występują w prezentacji.

## Wdrożenie (Heroku)

1. Wdrażamy tylko katalog `web-app/`: `git subtree push --prefix web-app heroku main` albo buildpack monorepo z `APP_BASE=web-app`.
2. Ustaw Config Vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_AUTH_SECRET`.
3. Heroku bierze wersję Node z `engines`, a `Procfile` uruchamia `npm start` (`next start -p $PORT`).
4. Sprawdź wdrożenie: `SMOKE_BASE_URL=https://<aplikacja>.herokuapp.com npm run smoke`.

Zweryfikowany adres https wpisujemy do `.planning/shared/CONTRACT.md` (sekcja "Bazowy URL").
