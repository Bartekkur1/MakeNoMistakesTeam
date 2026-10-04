# Phase 3: Prezentacja, demo i zgłoszenie - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Gotowe zgłoszenie Defence: talia sli.dev (najwyżej 10 slajdów: problem, odbiorcy, konkurencja, wyróżnik, demo, pomiar, architektura, zakres wykonany, dalszy pilotaż), scenariusz demo na scenę, zapasowe nagrania i linki, sprawdzone wymagania zgłoszenia oraz ujawnienie AI i zasobów. Wyniki syntetyczne nigdzie nie mogą wyglądać jak badanie dzieci (SUB-01..SUB-04).

Faza nie buduje funkcji produktu. Demo pokazuje to, co dostarczą workstreamy `roblox`, `widget` i `api-ui` i co sprawdzi faza 2 (test integracyjny).

</domain>

<decisions>
## Implementation Decisions

### Język i odbiorca
- **D-01:** Wszystko po polsku: slajdy, notatki prezentera, nagrania, opis zgłoszenia i README zgłoszenia. Bez wersji angielskiej.
- **D-02:** Projektujemy pod pitch **5 min**: około 2 min slajdów, 2 min demo i 1 min pomiar z pilotażem. To założenie, bo regulamin (`defence/zasady.pdf`) nie podaje czasu. Po ogłoszeniu szczegółów przez organizatora skalujemy przez przeniesienie treści do notatek lub aneksu, bez przebudowy talii.
- **D-03:** Na scenie mówi jedna osoba (osoba 4), a osobny operator klika demo. Scenariusz demo ma kolumny „mówi” i „klika” oraz sygnały przejścia.
- **D-04:** Jedna talia, oszczędna na scenę, z pełną narracją w notatkach prezentera sli.dev. Eksport PDF ma być czytelny bez głosu, bo w 1. etapie jury ocenia materiały bez nas. Dopuszczalne są krótkie podpisy pod kluczowymi elementami.

### Scenariusz demo
- **D-05:** Wiadomość w części „codzienna sytuacja” to scenka 4 z `research.md` §B13, „Przejdźmy na Discorda” (przeniesienie poza platformę, prezent od obcego, prośba o sekret). Wszystkie nicki są fikcyjne.
- **D-06:** Na scenie pokazujemy pełną ścieżkę w skrócie, około 2 min: misja Roblox (Studio) przez 20–30 s, tylko na kluczowym wyborze → dziecko wkleja wiadomość z Discorda pomocnikowi → pytania i sygnały → przekazanie sprawy opiekunowi (dziecko widzi, co udostępnia) → odpowiedź opiekuna → rzut oka na panel wyników klasy (oznaczony jako syntetyczny).
- **D-07:** Plan awaryjny: każdy etap demo ma krótki klip wideo osadzony w odpowiednim slajdzie sli.dev. Gdy coś padnie na żywo, prezenter mówi „pokażę z nagrania” i jedzie dalej bez szukania plików.
- **D-08:** Uczciwa wiadomość (scenka 7, „Ola z 5b”) i brak pewności pomocnika **nie** są pokazywane na scenie. Muszą być w pełnym nagraniu demo do zgłoszenia (pokrycie VER-02/SUB-03).

### Narracja i liczby
- **D-09:** Otwarcie od historii dziecka: Kuba, 11 lat, dostaje w Roblox wiadomość „przejdźmy na Discorda, nie mów rodzicom”. Zaraz potem liczba 28% vs 13% (NASK). Ta sama scenka wraca w demo (D-05), więc narracja ma klamrę.
- **D-10:** Na slajdy trafiają cztery liczby ✅, każda ze źródłem i rokiem w stopce slajdu:
  1. 28% nastolatków ofiarą cyberataku, rodzice potwierdzają 13% (NASK „Nastolatki” 2024/25)
  2. 4,72 mln użytkowników Roblox w PL (Mediapanel VIII 2025)
  3. Roblox to 2. najczęściej podszywana marka w phishingu, 12,32% (NordVPN 2026; oznaczyć jako dane komercyjne, spoza PL)
  4. Efekt treningu znika po 4 tyg. (Lastdrager 2017) i tylko 5 z 57 badań ma grupę kontrolną (Damenu 2025). To uzasadnienie naszego pomiaru.
  Pozostałe liczby z `research.md` trafiają tylko do notatek lub aneksu. Nie używamy liczb oznaczonych 🟡 ani ❌.
- **D-11:** Konkurencja jako tabela z ptaszkami. Wiersze: Sieciaki, Asy Internetu/Interlandia, Europol Cyber Defenders, 116 111, Roblox Safety Center, my. Kolumny: trening w grze / pomoc w realnej sytuacji / panel opiekuna / pomiar skuteczności. Tylko my mamy ptaszki we wszystkich kolumnach. Wyróżnikiem nie jest „gra na Robloxie”, bo Europol ją ma.
- **D-12:** Zakończenie: plan pilotażu (1–2 szkoły, trening vs zwykła lekcja, test bez pomocnika przed i po, powtórka po 2–4 tyg.) oraz model: darmowe dla dziecka i rodzica, płaci szkoła, samorząd lub sponsor, z argumentem ustawy „Kamilka” (standardy ochrony małoletnich od 15.08.2024).

### Wygląd i uczciwość
- **D-13:** Styl talii: paleta Scamerino z `assets/scamerino_palette.css` (shark-blue jako główny, ice-surface jako tło, hook-crimson dla oszustwa i zagrożenia, siren-amber dla ostrzeżeń, padlock-gold dla bezpiecznego). Jasne tło. Rekin Scamerino Alertinio pojawia się na otwarciu, przy demo i na zakończeniu, ale nie na każdym slajdzie.
- **D-14:** Każdy zrzut ekranu i wykres z wynikami ma stałą, widoczną etykietę „DANE SYNTETYCZNE — demo mechanizmu pomiaru”. Prezenter mówi przy tym jedno zdanie: „to nie jest badanie dzieci, to pokazuje, jak będziemy mierzyć”. To zdanie ma być też w notatkach (SUB-04).
- **D-15:** Ujawnienie AI i zasobów: jedna linijka na slajdzie „zakres wykonany” (AI, narzędzia, źródła danych) oraz pełna lista narzędzi, modeli, zasobów graficznych i źródeł w repo (README lub plik zgłoszeniowy) (SUB-02).
- **D-16:** Granice walidacji są wplecione w slajd pomiaru lub zakresu jako sekcja „Nie sprawdziliśmy jeszcze”: zrozumiałość dla 9-latków, test z dziećmi, trwałość efektu. Testy z dorosłymi nazywamy „testem obsługi”. Nie ma osobnego slajdu.

### Claude's Discretion
- Dokładny podział 9 sekcji na najwyżej 10 slajdów (np. tytuł z historią dziecka jako slajd 1, problem i odbiorcy razem) oraz kolejność. Wymagane sekcje z SUB-01 muszą się zmieścić.
- Wygląd slajdu architektury (prosty diagram: Roblox / rozszerzenie / strona mobilna → backend → panel opiekuna, panel wyników).
- Format, długość i hosting zapasowych klipów i pełnego nagrania (np. MP4 w repo lub YouTube niepubliczny). Linki muszą działać bez logowania.
- Naprawa `slides/package.json`: skrypty wskazują na nieistniejący `hubmi.md` (pozostałość po innym projekcie). Nazwa pliku talii jest dowolna, np. `slides/slides.md`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wymagania i zakres
- `.planning/workstreams/presentation/REQUIREMENTS.md` — SUB-01..SUB-04 (sekcje talii, ujawnienie AI, demo i nagranie, syntetyczne wyniki)
- `.planning/workstreams/presentation/ROADMAP.md` §Phase 3 — kryteria sukcesu
- `.planning/PROJECT.md` — opis produktu, out of scope, ograniczenia (fikcyjne dane, Studio zamiast publikacji)
- `ideas/defence/taski.md` — P8/P9 (osoba 4), kamień milowy 21 h: „prezentacja i nagranie gotowe”

### Treść pitchu
- `ideas/defence/research.md` §„Kluczowe liczby na pitch” — jedyne dozwolone liczby (✅)
- `ideas/defence/research.md` §B11 — tabela konkurencji (źródło D-11)
- `ideas/defence/research.md` §B12 — rynek, model, finansowanie (źródło D-12)
- `ideas/defence/research.md` §B13 — scenki 4 (Discord) i 7 (uczciwa wiadomość)
- `ideas/defence/research.md` §B10 — Roblox Kids/Select (dlaczego demo w Studio), AI Act art. 50 (awatar mówi, że jest AI)
- `ideas/defence/koncepcja.md` — pomysł, wyróżnik, sposób pomiaru
- `.planning/shared/MEASUREMENT.md` — definicje pomiaru i granice twierdzeń (slajd pomiaru)

### Wygląd
- `assets/scamerino_palette.css` / `assets/scamerino_palette.md` — tokeny kolorów
- `assets/Scamerino_Alertinio.png`, `assets/scamerino_alertino_preview.png` — grafika rekina

### Zgłoszenie
- `defence/zasady.pdf` — regulamin (lokalny, nieśledzony w git): etap 1 to ocena repo, linków i materiałów, etap 2 to pitch finalistów. Szczegóły zadania mają być podane na starcie. Aktualne wymagania sprawdzić u organizatora (SUB-02).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `slides/` — zainstalowane `@slidev/cli` ^53 i `@slidev/theme-default` (jest `node_modules`). Pliku talii jeszcze nie ma.
- `assets/scamerino_palette.css` — gotowe zmienne CSS do podpięcia w stylu talii sli.dev.
- Grafika rekina (PNG) do slajdów; model `.glb` niepotrzebny w talii.

### Established Patterns
- Pliki ścieżki trzymamy w `ideas/defence/`. Katalog `defence/` zawiera tylko lokalne, nieśledzone PDF-y.
- `slides/` jest obecnie nieśledzony w git. Należy go dodać bez `node_modules` (sprawdzić `.gitignore`).

### Integration Points
- Demo i klipy zależą od działających: misji Roblox (Studio), widgetu i strony mobilnej oraz panelu opiekuna i wyników (`api-ui`). Klipy nagrywamy po teście integracyjnym (faza 2).
- Panel wyników musi sam wyświetlać etykietę syntetycznych danych (taski O5). Talia powtarza ją na zrzutach.

</code_context>

<specifics>
## Specific Ideas

- Klamra narracyjna: historia Kuby z otwarcia to ta sama wiadomość, którą operator wkleja w demo.
- Etykieta dosłownie: „DANE SYNTETYCZNE — demo mechanizmu pomiaru”.
- Hasło pomocnika z CERT Orange można użyć na slajdzie lub w demo: „darmowe + link = pytam dorosłego”.
- Linki w materiałach pokazujemy jako nieklikalny tekst z `[.]` (zgodnie z §B13).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-prezentacja-demo-i-zgloszenie*
*Context gathered: 2026-10-03*
