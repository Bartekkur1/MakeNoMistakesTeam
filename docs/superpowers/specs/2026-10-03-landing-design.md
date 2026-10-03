# Landing BezpiecznaAura — projekt

**Data:** 2026-10-03
**Zakres:** wyłącznie strona startowa `/` w `web-app`. Żadnych innych ekranów, integracji ani zmian poza landingiem.

## Cel i odbiorca

Landing prawdziwego produktu. Czytają go **rodzice/opiekunowie** dzieci 10–13 lat oraz **nauczyciele**. Strona ma ich przekonać, że BezpiecznaAura pomaga dziecku rozpoznać oszustwo w sieci i bez wstydu poprosić o pomoc — i doprowadzić do instalacji wtyczki albo zalogowania się.

**Ustalone z użytkownikiem:**
- odbiorca: rodzice, opiekunowie, nauczyciele (nie jury);
- strona czysto statyczna (bez interaktywnych elementów);
- CTA: instalacja wtyczki (GitHub Release + instrukcja) i logowanie (`/login`, zwykły link);
- zakres wyłącznie landing.

**Zasady przekonywania (uczciwie):**
- żadnych zmyślonych opinii, logotypów szkół, liczby użytkowników ani obietnic skuteczności;
- liczby tylko oznaczone ✅ w `ideas/defence/research.md`, każda ze źródłem i rokiem; dane spoza Polski oznaczone krajem;
- przekonujemy tym, co realnie zdejmuje obawy: rodzic nie śledzi dziecka, dziecko samo decyduje, co pokazuje, pomocnik niczego nie gwarantuje, a uczy sprawdzać;
- jedna drobna, uczciwa informacja: „Wersja demonstracyjna — dane w panelu są fikcyjne”.

**Założenia:** język polski; jasny motyw wg palety Scamerino; ton ciepły, konkretny, bez straszenia; zwracamy się do rodzica na „Ty”; bez nowych zależności npm.

## Sekcje (kolejność od góry)

1. **Nagłówek** — logo (Scamerino) + „BezpiecznaAura”; kotwice „Jak to działa” (`#jak-to-dziala`), „Dla rodziców” (`#rodzice`), „Dla nauczycieli” (`#nauczyciele`), „FAQ” (`#faq`); przycisk „Zaloguj się” → `/login`. Na telefonie widoczne tylko logo i „Zaloguj się” (kotwice ukryte, bez menu rozwijanego — strona jest statyczna).
2. **Hero** — nagłówek w stylu „Twoje dziecko rozpozna oszustwo w grze — i wie, że może przyjść z tym do Ciebie”; podtytuł: cyberpomocnik Scamerino dla dzieci 10–13 lat, który w grach, na Discordzie, w mailu i SMS-ach pomaga sprawdzić podejrzaną wiadomość i pokazać ją rodzicowi. Przyciski: „Zainstaluj wtyczkę” (`#instalacja`), „Zobacz, jak to działa” (`#jak-to-dziala`). Grafika Scamerino obok (na telefonie nad tekstem).
3. **Problem, który znasz** — trzy karty liczb (NASK „Nastolatki” 2024/2025, Polska):
   - **28%** nastolatków padło ofiarą cyberprzestępstwa (najczęściej włamanie na konto i kradzież przedmiotów w grach) — rodzice wiedzą o tym tylko w 13% przypadków;
   - **66%** rodziców zakłada, że dziecko samo przyjdzie po pomoc — a przy cyberprzemocy 47% dzieci nic nie zrobiło;
   - **4,72 mln** użytkowników Robloxa w Polsce — to dziś lider wśród gier (Mediapanel, VIII 2025).

   Pod kartami 3 krótkie, fikcyjne przykłady typowych sytuacji (z A3 research): „Darmowe Robuxy — wystarczy podać kod z SMS-a”, „Admin gry prosi o hasło, bo konto zostanie usunięte”, „Wyślij przedmiot pierwszy, potem ja oddam”.
4. **Jak to działa** (`#jak-to-dziala`) — 4 kroki z perspektywy rodziny:
   1. Dziecko dostaje podejrzaną wiadomość w grze, na Discordzie, w mailu lub SMS-ie.
   2. Klika Scamerino we wtyczce i przekazuje treść — tylko tę, którą samo wybierze.
   3. Pomocnik zadaje kilka krótkich pytań, pokazuje sygnały ostrzegawcze i proponuje następny krok.
   4. Jednym kliknięciem dziecko pokazuje sprawę Tobie — odpowiadasz w panelu rodzica.

   Pod spodem jedno zdanie o treningu: ta sama postać prowadzi misję w Roblox, w której dziecko ćwiczy reakcję na oszustwo bez ryzyka.
5. **Dla rodziców** (`#rodzice`) — „Spokój bez kontrolowania dziecka”: 4 punkty:
   - widzisz tylko sprawy, które dziecko samo Ci przekazało — nie czytamy jego wiadomości;
   - dziecko przed wysłaniem widzi dokładnie, co udostępnia;
   - Ty decydujesz, czy sprawa trafia do szkoły;
   - z nauczycielem rozmawiasz w wątku, którego dziecko nie widzi.
6. **Dla nauczycieli** (`#nauczyciele`) — „Lekcja, której efekt widać”: 3 punkty:
   - gotowa misja w Roblox na zajęcia o bezpieczeństwie w sieci;
   - test przed i po treningu, bez pomocnika — widzisz postęp klasy: trafność decyzji i niepotrzebne alarmy, tylko w formie zbiorczej;
   - prowadzisz zgłoszenia zatwierdzone przez rodzica i w razie potrzeby eskalujesz je (np. do NASK).

   Uzasadnienie pomiaru jednym zdaniem: badania pokazują, że efekt jednorazowego szkolenia antyphishingowego potrafi zniknąć po 4 tygodniach (Lastdrager i in., 2017, Holandia) — dlatego mierzymy, a nie zakładamy.
7. **Bezpieczeństwo i zasady** — sekcja zaufania, 5 krótkich zasad z ikonami:
   - Dziecko decyduje, co pokazuje — pomocnik nie czyta automatycznie innych aplikacji.
   - Nie obiecujemy, że wiadomość jest bezpieczna — uczymy, jak to sprawdzić.
   - Pokazanie rodzicowi i zgłoszenie na platformie to dwie osobne decyzje.
   - Punkty za umiejętności, nie za liczbę zgłoszeń. Bez publicznych rankingów i kar za proszenie o pomoc.
   - Nauczyciel widzi wyniki klasy zbiorczo, a sprawy tylko po zgodzie rodzica.
8. **Instalacja wtyczki** (`#instalacja`) — przycisk „Pobierz wtyczkę dla Chrome” → `https://github.com/Bartekkur1/MakeNoMistakesTeam/releases/latest/download/bezpiecznaaura-wtyczka.zip`, link „Wszystkie wersje” → `https://github.com/Bartekkur1/MakeNoMistakesTeam/releases`. Instrukcja (lista numerowana):
   1. Pobierz plik ZIP i rozpakuj go.
   2. W Chrome wpisz w pasku adresu `chrome://extensions` (tekst w ramce do skopiowania — Chrome nie otwiera tego adresu z linku).
   3. Włącz „Tryb dewelopera” w prawym górnym rogu.
   4. Kliknij „Załaduj rozpakowane” i wskaż rozpakowany folder.
   5. Przypnij ikonę BezpiecznaAura na pasku przeglądarki.

   Dopisek: na telefonie dziecko może wkleić treść wiadomości na stronie pomocnika (bez instalacji).
9. **FAQ** (`#faq`) — natywne `<details>/<summary>` (działa bez JS):
   - *Czy czytacie wiadomości mojego dziecka?* — Nie. Pomocnik widzi tylko treść, którą dziecko samo zaznaczy lub wklei.
   - *Czy pomocnik powie, że wiadomość jest bezpieczna?* — Nie daje takiej gwarancji; pokazuje sygnały i podpowiada, jak sprawdzić oficjalnym kanałem.
   - *Co widzi nauczyciel?* — Zbiorcze wyniki testów klasy oraz te zgłoszenia, które zatwierdził rodzic.
   - *Na jakich urządzeniach działa?* — Wtyczka w Chrome na komputerze; na telefonie strona do wklejenia treści.
   - *Dla jakiego wieku?* — Dla dzieci 10–13 lat.
   - *Czy to zastępuje rozmowę z dzieckiem?* — Nie — ułatwia ją: dziecko przychodzi z konkretną sprawą, a Ty wiesz, co się stało.
10. **Końcowe CTA** — krótkie zdanie + przyciski „Zainstaluj wtyczkę” (`#instalacja`) i „Zaloguj się” (`/login`). Obok mała ramka „Chcesz zobaczyć panel? Wypróbuj konto demo”: e-maile z `presentableDemoAccounts()` (3 rodziców, 2 nauczycieli) i kod `DEMO_LOGIN_CODE`.
11. **Stopka** — „BezpiecznaAura · Make No Mistakes Team”, „Wersja demonstracyjna — dane w panelu są fikcyjne”, link „Źródła danych” rozwijany przez `<details>` z pełną listą źródeł liczb z sekcji 3 i 6.

**Poza zakresem:** interaktywne elementy, animacje, model 3D, menu mobilne, cennik, opinie/logotypy, formularz kontaktowy, link do gry Roblox, wejście do testu przed–po, ekran `/login`, budowanie ZIP-a i tworzenie wydania na GitHubie.

## Technika

- **Struktura plików** (`web-app/src/app/`):
  - `page.tsx` — tylko składa sekcje.
  - `_landing/content.ts` — wszystkie teksty, liczby ze źródłami (`STATS: { value, label, source }[]`), FAQ, zasady, stałe linków (`RELEASES_URL`, `EXTENSION_DOWNLOAD_URL`, `LOGIN_HREF = "/login"`) oraz `presentableDemoAccounts()` — odrzuca konta, których `display_name` zawiera „(smoke)”.
  - `_landing/SiteHeader.tsx`, `Hero.tsx`, `Problem.tsx`, `HowItWorks.tsx`, `ForParents.tsx`, `ForTeachers.tsx`, `Principles.tsx`, `Install.tsx`, `Faq.tsx`, `FinalCta.tsx`, `SiteFooter.tsx` — po jednym komponencie na sekcję.
  - Folder z podkreślnikiem nie tworzy trasy w App Routerze.
- **Server Components, zero JS klienta** — nawigacja kotwicami, `scroll-behavior: smooth` i `scroll-margin-top` dla sekcji pod przyklejonym nagłówkiem; FAQ i źródła przez `<details>`.
- **Konta demo** — import `DEMO_ACCOUNTS` i `DEMO_LOGIN_CODE` z `src/lib/contract/demo-accounts.ts` (bez kopiowania danych).
- **Wygląd** — tokeny z `assets/scamerino_palette.css` przeniesione do `globals.css` w `@theme` (Tailwind 4); usunięty ciemny motyw z szablonu; usunięte nadpisanie `font-family: Arial` w `body`, żeby działał Geist z `layout.tsx`. `shark-blue` dla CTA, `siren-amber`/`hook-crimson` tylko jako akcent przy przykładach oszustw, tekst `navy-slate`/`muted-slate`.
- **Grafika** — `assets/Scamerino_Alertinio.png` skopiowana do `web-app/public/scamerino.png`, `next/image` z `priority` w hero i opisowym `alt`.
- **`layout.tsx`** — `lang="pl"`, `metadata.title` „BezpiecznaAura — cyberpomocnik dla dzieci”, `description` jednym zdaniem dla rodziców. Pozostałe pliki szablonu (`next.svg`, `vercel.svg` itd.) zostają.
- **Responsywność** — jedna kolumna na telefonie; od `md` hero dwukolumnowe i siatki kart; brak poziomego przewijania przy 360 px.
- **Dostępność** — jeden `h1`, sekcje z `h2`, kolejność nagłówków bez przeskoków, linki zewnętrzne z `rel="noopener noreferrer"`, widoczny focus, kontrast tekstu min. WCAG AA.

## Testy i weryfikacja

- `tests/landing/content.test.ts` (vitest):
  - `presentableDemoAccounts()` nie zwraca kont „(smoke)” i zwraca 3 rodziców i 2 nauczycieli;
  - każdy element `STATS` ma niepuste `source`;
  - `EXTENSION_DOWNLOAD_URL` zaczyna się od `RELEASES_URL` i kończy na `.zip`;
  - każde pytanie FAQ ma niepustą odpowiedź.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` przechodzą.
- Ręczny przegląd w przeglądarce przy ~375 px i ~1280 px: kotwice przewijają do sekcji pod nagłówkiem, FAQ się rozwija, link pobrania ma właściwy URL, brak poziomego scrolla.

## Ryzyka i zależności zewnętrzne

- Link pobrania działa dopiero, gdy repo jest publiczne i istnieje wydanie z plikiem `bezpiecznaaura-wtyczka.zip` — robi to człowiek, poza zakresem landingu.
- `/login` zwraca 404, dopóki panel go nie doda — świadoma decyzja.
- Teksty o funkcjach (panel rodzica, eskalacja, test przed–po) opisują docelowe działanie produktu z `.planning/PROJECT.md`; jeśli zakres się zmieni, trzeba zaktualizować `content.ts`.
