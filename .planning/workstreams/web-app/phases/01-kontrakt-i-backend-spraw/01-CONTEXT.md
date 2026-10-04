# Phase 1: Kontrakt i backend spraw - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Faza daje:
1. **Działające API spraw i odpowiedzi** z trwałym zapisem (API-01, API-02). Sprawę można utworzyć, wylistować i pobrać. Do sprawy można dodać odpowiedź i zmienić jej status (nowa → w rozmowie → zakończona). Wszystko przeżywa odświeżenie i restart.
2. **Uzupełniony kontrakt** w `.planning/shared/CONTRACT.md`: ścieżki, kody błędów i przykładowe JSON-y. Kontrakt zatwierdza osoba 2, a przykładowe dane trafiają do `shared/`.

Faza 1 NIE obejmuje: panelu opiekuna (faza 2), zapisu i liczenia wyników testów, pochodzenia (origin) ani widoku nauczyciela (faza 3, API-03..05), integracji z widgetem i Roblox na prawdziwych zapisach (faza 4). Kontrakt może już opisać obiekt „Wynik” z `CONTRACT.md`, ale jego endpointy implementuje faza 3.

</domain>

<decisions>
## Implementation Decisions

### Stack, zapis i adres
- **D-01:** API to **route handlers Next.js** (`web-app/src/app/api/...`) w istniejącym projekcie `web-app/` (Next.js 16, React 19, TypeScript). Nie ma osobnego serwera. Panel opiekuna z fazy 2 korzysta z tego samego projektu i tych samych typów.
- **D-02:** Trwały zapis w **Supabase (Postgres)**. — **Reversibility:** costly — zmiana oznacza przepisanie warstwy dostępu do danych i migrację danych demo
- **D-03:** Z Supabase łączy się **wyłącznie serwer Next.js, kluczem service_role** trzymanym w zmiennych środowiskowych (lokalnie `.env.local`, na demo config vars Heroku). Klienci (widget, strona mobilna, panel, serwer Roblox) wołają tylko nasze `/api/...` i nigdy nie dostają klucza Supabase. RLS nie jest potrzebne. Walidacja i (w fazie 3) liczenie wyniku zostają w backendzie. Tak realizujemy regułę „sekrety nigdy w kliencie”.
- **D-04:** Na demo backend działa na **Heroku** pod publicznym adresem https. Ten jeden adres jest bazowym URL-em dla rozszerzenia, telefonu i serwera Roblox. Localhost służy do developmentu. Aplikacja musi startować na Heroku (`npm run build` + `npm start`, port z `$PORT`), a adres trafia do `CONTRACT.md`. — **Reversibility:** reversible — inne klienty trzymają tylko bazowy URL
- **D-05:** Schemat bazy to **migracje SQL w repo** (`web-app/supabase/migrations/*.sql`). Są wersjonowane i odtwarzalne, a faza 3 dopisze kolejną migrację (wyniki). Nie używamy ORM-a.

### Ograniczenia wykonawcze (globalne zasady użytkownika)
- **D-06:** Agenci **nie uruchamiają SQL, Supabase CLI ani wywołań API Supabase i nie czytają plików `.env*` bez wyraźnej zgody użytkownika w danej wiadomości**. Najpierw muszą powiedzieć wprost, co chcą zrobić (projekt, środowisko, cel), i poczekać na zgodę. Plan powinien oznaczyć zastosowanie migracji i ustawienie zmiennych na Heroku jako krok wykonywany przez człowieka (checkpoint). Podobnie każdą weryfikację na żywej bazie.
- **D-07:** Bez komend git, jeśli użytkownik o nie wprost nie poprosi.

### Model zgłoszenia — rewizja kontraktu v1 (2026-10-03, decyzje użytkownika)
Kontrakt v1 z planu 01-01 (commit `8b4ee4d`, model „sprawa + odpowiedzi opiekuna”, bez logowania) **nie został zatwierdzony**. Poniższe decyzje go zastępują i są nadrzędne wobec wcześniejszych zapisów tego pliku oraz planów 01-01…01-04 (wymagają przeplanowania).
- **D-08 Obieg zgłoszenia:** dziecko zgłasza → **rodzic** zatwierdza albo odrzuca → zatwierdzone trafia do **nauczyciela** → nauczyciel **nie zatwierdza**, tylko prowadzi sprawę i **zamyka ją, gdy jest rozwiązana**. Nauczyciel może też **eskalować** incydent do NASK lub innej organizacji (w MVP: zmiana stanu + zapis w historii z notatką, do kogo eskalowano; bez realnej wysyłki).
- **D-09 Wznawianie:** decyzje można cofać — rodzic może zmienić decyzję, a odrzucone/zamknięte zgłoszenie można wznowić. Dokładną macierz przejść ustala planner; każde przejście ma jawną listę dozwolonych ról.
- **D-10 Historia:** każda zmiana stanu zapisuje wpis w historii (kto, rola, kiedy, z jakiego stanu w jaki, opcjonalny komentarz). Historia jest tylko do dopisywania.
- **D-11 Dyskusja:** zgłoszenie ma wątek komentarzy dla **rodzica i nauczyciela**, **niewidoczny dla dziecka**. Nie ma „odpowiedzi do dziecka” — dawne `replies` i API-02 w starej formie znikają.
- **D-12 Treść zgłoszenia od dziecka:** dziecko wskazuje **rodzaj ataku** i dla niego zaznacza **checkboxy działań, które już podjęło** (np. „kliknąłem w link”, „podałem dane”, „zapłaciłem”) — lista wielokrotnego wyboru zamiast pojedynczego `already_acted`. Zestaw checkboxów może zależeć od rodzaju ataku.
- **D-13 Poza zakresem teraz:** `signals` i `selected_action` (sygnały wykryte przez pomocnika, działanie wybrane w misji) — odłożone. Teraz wystarczy samo zgłaszanie.
- **D-14 Logowanie demo:** na sztywno kilka kont rodziców i nauczycieli. Logowanie e-mailem; w teorii kod przychodzi mailem, w demo kod to zawsze **`0000`**. Dziecko się **nie loguje**: rodzic instaluje wtyczkę i loguje się w niej swoim mailem, więc zgłoszenie z wtyczki jest powiązane z kontem rodzica (i dzieckiem demo tego rodzica). Powiązanie rodzic ↔ nauczyciel (np. klasa) — na sztywno w danych demo. Konta i adresy wyłącznie fikcyjne (domena `.example`).
- **D-15 Widoczność nauczyciela:** nauczyciel widzi pełne zgłoszenia zatwierdzone przez rodzica (zastępuje dawną zasadę API-05 „tylko agregaty, nigdy prywatne sprawy” w części dotyczącej zgłoszeń). Rodzic widzi tylko zgłoszenia swojego dziecka.
- **D-16 Listy:** bez sztywnego limitu 200 — **paginacja** (planner wybiera kursor albo stronę; rekomendacja: kursor `?limit=&cursor=`).
- **D-17 Tworzenie zgłoszenia:** `POST` nie jest idempotentny (zaakceptowane).
- **D-18 Git w tym przebiegu:** użytkownik zezwolił na `git add`/`git commit` na gałęzi `gsd/phase-01-kontrakt-i-backend-spraw` (bez push/merge); stage wyłącznie jawnych ścieżek. Pozostałe ograniczenia D-06 bez zmian.

### Claude's Discretion
Użytkownik nie wybrał tych obszarów do dyskusji, więc decyduje planner w granicach `CONTRACT.md`:
- **Kształt kontraktu:** ścieżki REST (np. `/api/cases`, `/api/cases/:id`, `/api/cases/:id/replies`, zmiana statusu), format ID (UUID z Postgresa), format `signals` i `selected_action`, enumy statusów (wartości mogą być ASCII, ale muszą jednoznacznie mapować się na nowa / w rozmowie / zakończona), jednolity format błędów i kody HTTP (400 walidacja, 404 brak sprawy, 500/503 błąd zapisu lub niedostępna baza), filtrowanie listy po `demo_child_id`. Klient nie może dostać fałszywego potwierdzenia zapisu (widget ERR-01).
- **Dostęp, role, CORS:** bez uwierzytelniania (fikcyjne profile, rola demonstracyjna). Dziecko pobiera odpowiedzi przez GET szczegółów sprawy, odpowiedzi są zagnieżdżone w sprawie lub dostępne pod osobnym endpointem. CORS musi przepuszczać wywołania z rozszerzenia (`chrome-extension://`) i strony mobilnej. Preflight OPTIONS jest obsłużony.
- **Dane przykładowe:** kilka fikcyjnych spraw w różnych statusach i ze źródłami (gra, mail, SMS, Discord), z treściami czysto fikcyjnymi. Przykłady JSON lądują w `.planning/shared/` (np. `shared/examples/`), a seed bazy jest skryptem lub migracją SQL. Ewentualny reset danych demo zostawiamy plannerowi.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Kontrakt i zasady wspólne
- `.planning/shared/CONTRACT.md` — obiekty (Sprawa, Odpowiedź, Wynik), lista operacji API, reguły (brak punktów od klienta, origin, brak prywatnych spraw u nauczyciela, sekrety poza klientem). Ta faza go uzupełnia.
- `.planning/shared/README.md` — zasady edycji `shared/` (właściciel, osobny commit `docs(shared): ...`, wzmianka w STATE dotkniętych workstreamów)
- `.planning/shared/MEASUREMENT.md` — definicje pomiaru i punktacji (kontekst dla obiektu Wynik, implementacja w fazie 3)

### Wymagania i plan
- `.planning/workstreams/web-app/REQUIREMENTS.md` — API-01, API-02 (ta faza) oraz API-03..05 (kontekst dla przyszłego kształtu kontraktu)
- `.planning/workstreams/web-app/ROADMAP.md` — kryteria sukcesu fazy 1
- `.planning/PROJECT.md` — ograniczenia projektu (fikcyjne dane, prywatność, priorytety przy braku czasu)
- `ideas/defence/taski.md` — W1 (kontrakt i backend), O6 (panel na danych przykładowych, potem prawdziwych), W5/W7 (wymagania widgetu wobec API), kamień milowy 2–3 h

### Konsumenci API
- `.planning/workstreams/widget/REQUIREMENTS.md` — HND-01 (podgląd i potwierdzenie zapisu), ERR-01 (niedostępny backend i nieudany zapis bez fałszywego potwierdzenia)
- `.planning/workstreams/widget/ROADMAP.md` — faza widgetu zależna od API spraw z web-app fazy 1

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web-app/` to świeży szkielet `create-next-app` (Next.js 16.3, React 19.2, Tailwind 4, ESLint, TypeScript, App Router w `src/app/`). Nie ma jeszcze logiki, typów ani klienta bazy.

### Established Patterns
- Brak, to pierwsza faza. Wzorce ustala ta faza: struktura `src/app/api/`, moduł dostępu do danych (klient Supabase tylko po stronie serwera) i wspólne typy obiektów kontraktu do użycia w fazie 2.

### Integration Points
- Widget (rozszerzenie i strona mobilna): tworzy sprawy i czyta odpowiedzi.
- Panel opiekuna (faza 2): lista, szczegóły, odpowiedź i status.
- Serwer Roblox (P1, faza 3/4): zapis wyników.
- Heroku: build i start Next.js, zmienne `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (nazwy według uznania plannera).

</code_context>

<specifics>
## Specific Ideas

- Dla całego zespołu ma istnieć jeden publiczny adres backendu (Heroku), wpisany do `CONTRACT.md`.
- Kamień milowy: kontrakt i przykładowe dane gotowe w 2–3 h od startu, bo inne tory (widget, panel) na nich startują.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-kontrakt-i-backend-spraw*
*Context gathered: 2026-10-03*
