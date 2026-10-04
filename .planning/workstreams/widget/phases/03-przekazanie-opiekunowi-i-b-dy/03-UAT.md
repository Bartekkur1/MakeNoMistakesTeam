---
status: complete
phase: 03-przekazanie-opiekunowi-i-b-dy
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-10-04T08:00:00Z
updated: 2026-10-04T05:43:28Z
---

## Current Test

[testing complete]

## Tests

### 1. Install opens one login tab; login page matches web-app
expected: Build and load unpacked `projects/widget/dist`. Exactly one login tab opens, no API request on install/open; extension reload opens no extra tab. Page matches web-app `/login` (avatar/brand, two-step card, palette, Polish copy, 48×56 digit boxes, blue focus, keyboard reachable, resizes). "Zobacz konta demo" lists only Mama Oli / Tata Kuby / Mama Zosi; Escape/Zamknij close with focus returning; "Użyj" fills email with no API call.
result: pass

### 2. Login flow: validation, errors, success
expected: Empty/malformed email shows the field error. Unknown valid .example email → Dalej opens code step without a request; any code then gives "Nieprawidłowy e-mail lub kod." (same as wrong code for Mama Oli), digits cleared, focus on box 1. Mama Oli + 0000: paste/autofill, overwrite, arrows and Backspace work; filling box 4 or Enter sends exactly one login; pending shows "Logowanie…" with buttons disabled; success shows "Mama Oli" and "Wtyczka połączona". Teacher `nauczyciel.5a@bezpiecznaaura.example` / 0000 shows the parent-only teacher message, no connected screen. Blocked network shows the network message.
result: pass

### 3. Remembered session and credential storage
expected: Close and reopen options after login → still connected, no API request. With saved `expires_at` set to a past date in worker DevTools, reopening still shows connected with no renewal traffic. Extension storage holds only `auraSession` with five fields (token/expiry/account/email/code); no case, draft, result or report list is stored; a content page cannot read credentials.
result: pass

### 4. Logout
expected: Click "Wyloguj" → no PIN/confirmation dialog, credentials removed, email form returns with the logged-out status banner.
result: pass

### 5. Result → Pokaż opiekunowi → preview (no send yet)
expected: Logged in as Mama Oli, paste (not select on Discord/Roblox/mail) "Gratulacje! Wygrałeś skina, odbierz nagrodę: https://nagroda-demo.example/odbierz" and answer the questions. Approval, questions and result make no report POST. On the result, "Pokaż opiekunowi" has focus. Clicking it shows "Sprawdź, co wyślesz", "Do: Mama Oli (demo)", read-only content ending with "Link: https://nagroda-demo.example/odbierz", proposed radio "Fałszywa nagroda lub konkurs" with a badge, no checkbox ticked, source "Inne". Still no POST.
result: pass

### 6. Edytowalny podgląd
expected: Wybierz „coś innego”, zaznacz wszystkie działania, potem wybierz „fałszywy link lub strona logowania” → niepasujące checkboxy znikają od razu, a fokus zostaje na tym radiu. Źródło da się zmienić na SMS. Zmiany zostają po „Wróć” oraz po zamknięciu i ponownym otwarciu panelu.
result: pass

### 7. Wysyłka i potwierdzenie
expected: Kliknij dwa razy „Wyślij” → dokładnie jeden POST /api/reports z nagłówkiem Bearer i tylko czterema polami, zgodnymi z podglądem. W trakcie: „Wysyłam…”, aria-busy, wszystkie kontrolki wyłączone poza zamknięciem. Potem: „Wysłano do: Mama Oli (demo)”, „Godzina wysłania: GG:MM” z created_at serwera, „Status: Czeka, aż rodzic zobaczy”, fokus na „Zamknij”, jest „Sprawdź nową wiadomość”. Panel rodzica pokazuje zgłoszenie. Zamknięcie/otwarcie przywraca potwierdzenie; wysłanej sprawy nie da się wysłać drugi raz (brak drugiego POST).
result: pass

### 8. Błędy wysyłki
expected: Symuluj po kolei (lokalny backend albo podmiana fetch w workerze): offline/503 → „Nie wysłano — brak połączenia”; 400/413/500 → „Nie wysłano”; timeout 15 s / 204 / zepsute lub niezgodne 2xx → „Nie wiemy, czy dotarło” z „Moje zgłoszenia” i „Wyślij jeszcze raz”. Wybory zostają, fokus na ponowieniu, brak automatycznego ponowienia — wysyłka tylko po kolejnym kliknięciu. Przeładowanie wtyczki przy otwartym podglądzie, potem „Wyślij” → „Nie wysłano” z tekstem o odświeżeniu strony i „Wróć”.
result: pass

### 9. Brak konta / zmiana konta przy podglądzie
expected: Wylogowany od początku: zamiast „Pokaż opiekunowi” jest komunikat o braku konta i „Otwórz logowanie”; sprawdzanie lokalne działa. Przy otwartym podglądzie wylogowanie pokazuje komunikat o braku konta i znika „Wyślij”; zalogowanie jako Tata Kuby zmienia linię „Do” i nic nie idzie, dopóki nie klikniesz „Wyślij” ponownie. Jeśli konto zmieni się w trakcie obsługi kliknięcia „Wyślij” → „Nie wysłano”, odbiorca zaktualizowany, brak POST do nieprzejrzanego rodzica.
result: pass

### 10. Odnowienie sesji i jedno ponowienie po 401
expected: Na lokalnym backendzie: przy wygasłej zapisanej sesji „Wyślij” najpierw odnawia, potem POST. Przy zepsutym tokenie z przyszłym expiry: jeden 401 → odnowienie → dokładnie jedno ponowienie. Dwie karty wysyłające naraz dzielą jedno odnowienie. Wylogowanie/zmiana konta w trakcie odnawiania nigdy nie przywraca starych danych ani nie wysyła na stare konto.
result: pass

### 11. Instrukcja „Jak zgłosić na platformie”
expected: Na wyniku: „Pokaż opiekunowi” (albo komunikat o braku konta), potem „Jak zgłosić na platformie”. Instrukcja mówi, że niczego nie wysyła, fokus na „Wróć do wyniku”; przełączanie Discord/Gra/Mail/SMS/Inne pokazuje ponumerowane kroki, tylko Gra ma link do Roblox; CERT Polska i Dyżurnet.pl otwierają się w nowej karcie; jest linia o 112; otwieranie/przełączanie instrukcji nie robi żadnych żądań wtyczki (kliknięte linki zewnętrzne pomijamy). Zamknięcie/otwarcie wraca do instrukcji. Źródło jest wspólne z podglądem (Discord w instrukcji → podgląd pokazuje Discord; SMS w podglądzie → instrukcja pokazuje SMS); nowy zatwierdzony tekst je resetuje.
result: pass

### 12. Lista „Moje zgłoszenia” i statusy
expected: Menu: Sprawdź wiadomość, Moje zgłoszenia, Jak to działa. Otwarcie „Moje zgłoszenia” pokazuje „Wczytuję zgłoszenia…”, potem dokładnie jeden GET /api/reports?limit=10 z Bearer; ponowne otwarcie = nowy GET. Wiersze to zwykły tekst (pierwsze 60 znaków + … gdy ucięte, typ ataku · data, status), kolejność z serwera, bez linków/szczegółów. Zmiana stanów w panelu rodzica daje: „Czeka, aż rodzic zobaczy”, „Rodzic poprosił o pomoc nauczyciela”, „Dorośli zgłosili to dalej”, „Sprawa zamknięta”, „Rodzic zobaczył — porozmawiajcie o tym”. Zero zgłoszeń → „Nie ma jeszcze zgłoszeń”.
result: pass

### 13. Błąd listy i brak konta
expected: Offline / zatrzymany backend → „Nie udało się wczytać zgłoszeń” + „Spróbuj ponownie”; ponowienie zastępuje wiersze, nie dokleja. Zepsute odpowiedzi (11 wierszy, null) dają błąd, nigdy częściową listę. Wylogowany → komunikat D-11 + „Otwórz logowanie”, bez GET.
result: issue
reported: "z offline ustawionym w network i tak dostaje info, ze wyslane"
severity: major

### 14. Niepewna wysyłka → lista → powrót do podglądu
expected: POST wisi >15 s. Przy „Nie wiemy, czy dotarło” kliknij „Moje zgłoszenia”, obejrzyj listę, kliknij „Wróć” → wraca podgląd z tym samym typem ataku, działaniami, źródłem i ostrzeżeniem. „Wyślij jeszcze raz” wysyła tylko po kliknięciu; otwarcie listy nigdy nie oznacza sprawy jako wysłanej.
result: pass

### 15. Lista: wyścig kont i cykl życia
expected: Przy otwartej liście wylogowanie czyści wiersze i pokazuje komunikat o braku konta; zalogowanie jako Tata Kuby czyści wiersze i robi jeden GET dla nowego konta; spóźniona odpowiedź starego konta nigdy się nie pokazuje. Zamknięcie/ukrycie w trakcie wolnego ładowania i ponowne otwarcie → nowy GET, stara odpowiedź odrzucona. Przeładowanie/nawigacja czyści listę, podgląd i sprawdzanie.
result: pass

### 16. Układ 280px i ton
expected: Przy 280px, wiadomości 2000 znaków, linku 2048 znaków i długim imieniu odbiorcy: pole treści przewija się w 160px, odbiorca się zawija, brak poziomego scrolla, kontrolki przewijają się w panelu, „Wyślij” osiągalne po przeciągnięciu do każdej krawędzi. Statusy, kroki i alerty brzmią spokojnie dla 9–13 lat; „Rodzic zobaczył — porozmawiajcie o tym” nie sugeruje winy; instrukcja nie sugeruje, że wtyczka coś zgłosiła moderatorom/CERT/nauczycielowi/rodzicowi. Tekst błędu przy zmianie konta („Nie wysłano” + nowa linia „Do”) jest OK.
result: pass

### 17. Exact MV3 permissions, authorized hosts and options entry retain top-frame injection and exposure guards.
expected: Exact MV3 permissions, authorized hosts and options entry retain top-frame injection and exposure guards.
result: pass
source: automated
coverage_id: 03-01/D1

### 18. Build packages external login assets and restricts AURA_API to the demo or localhost origin.
expected: Build packages external login assets and restricts AURA_API to the demo or localhost origin.
result: pass
source: automated
coverage_id: 03-01/D2

### 19. Inherited local capture, menu, drag, draft and bfcache behavior retains network and content-persistence guards.
expected: Inherited local capture, menu, drag, draft and bfcache behavior retains network and content-persistence guards.
result: pass
source: automated
coverage_id: 03-01/D9

### 20. Privacy scan exceptions limited to worker fetch/storage and options copy, preserving all unsafe-sink bans.
expected: Privacy scan exceptions are limited to worker fetch/storage and options copy, preserving all unsafe-sink bans.
result: pass
source: automated
coverage_id: 03-01/D10

### 21. D-16 corrects HND-02/HND-03 wording without changing progress.
expected: D-16 corrects HND-02/HND-03 wording and records the web-app status interpretation without changing progress.
result: pass
source: automated
coverage_id: 03-01/D11

### 22. Demo guardian protocol retired; constants centralized.
expected: Demo guardian protocol retired; constants centralized; no handler can acknowledge the old request.
result: pass
source: automated
coverage_id: 03-02/D5

### 23. Inherited browser flows remain local-only with no session status on boot.
expected: Inherited capture/check/tracer browser flows remain local-only (assertOnlyLocal) with no session status on boot.
result: pass
source: automated
coverage_id: 03-02/D6

### 24. Menu shows exactly Sprawdź wiadomość, Moje zgłoszenia, Jak to działa in order.
expected: Menu shows exactly Sprawdź wiadomość, Moje zgłoszenia, Jak to działa in order.
result: pass
source: automated
coverage_id: 03-03/D1

### 25. Inherited unit and browser suites pass; boot privacy unchanged.
expected: Inherited unit and browser suites pass; boot privacy/no-background-reading unchanged.
result: pass
source: automated
coverage_id: 03-03/D6

## Summary

total: 25
passed: 24
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-03-1
  truth: "Offline (DevTools Network → Offline) nie może skończyć się potwierdzeniem wysyłki ani udaną listą; ma być „Nie wysłano — brak połączenia” / „Nie udało się wczytać zgłoszeń”"
  status: failed
  reason: "User reported: z offline ustawionym w network i tak dostaje info, ze wyslane"
  severity: major
  test: 13
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
