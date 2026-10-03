# BezpiecznaAura — cyberpomocnik dla dzieci

## What This Is

Kreskówkowy awatar-pomocnik uczy dzieci 10–13 lat rozpoznawać phishing, wyłudzanie danych i pułapki zakupowe. Działa w treningu szkolnym (misja w Roblox, test przed–po) oraz pomaga przy podejrzanej wiadomości z gry, maila, SMS-a lub Discorda: dziecko przekazuje treść, pomocnik zadaje krótkie pytania, wyjaśnia sygnały zagrożenia i proponuje następny krok. Opiekun widzi sprawy przekazane przez dziecko i może odpowiedzieć; nauczyciel widzi wyniki ćwiczeń, nie prywatne sprawy.

Maskotką rozwiązania jest **Scamerinio Alertinio** (model i paleta w `assets/`).

Zgłoszenie na HackYeah 2026 (Kraków), ścieżka **Defence**. Źródło: `ideas/defence/koncepcja.md` i `ideas/defence/taski.md`.

## Core Value

Dziecko ćwiczy reakcję na oszustwo i łatwo prosi o pomoc: ścieżka treść → pytania → wskazówki → działanie → odpowiedź opiekuna działa od końca do końca, a skuteczność treningu da się zmierzyć (test przed–po bez pomocnika).

## Business Context

- **Customer**: Szkoły (trening i pomiar), opiekunowie (pomoc przy sprawach), dzieci 10–13 lat
- **Revenue model**: Brak (projekt hackathonowy)
- **Success metric**: Demo na żywo przechodzi całą historię; wyniki przed–po da się ręcznie przeliczyć
- **Strategy notes**: `ideas/defence/koncepcja.md`

## Requirements

### Validated

- ✓ **widget / Phase 1 (WID-01, WID-02):** rozszerzenie z awatarem przyjmuje zaznaczoną lub wklejoną treść wyłącznie na działanie użytkownika; wszystkie 5 testów UAT zaliczone.

### Active

Szczegółowe wymagania są w workstreamach (`.planning/workstreams/<nazwa>/REQUIREMENTS.md`); wspólny kontrakt i treści w `.planning/shared/`.

- [ ] **roblox**: jedna misja Roblox (oferta darmowego przedmiotu → prośba o kod konta) z wyborami, konsekwencjami, pomocnikiem, wynikiem i kosmetyczną nagrodą
- [ ] **widget**: rozszerzenie przeglądarkowe z awatarem i ścieżką sprawdzania oraz mobilna strona do wklejenia treści
- [ ] **api-ui**: backend (sprawy, odpowiedzi, wyniki testów), panel opiekuna, ekran testu przed–po i panel wyników klasy
- [ ] **presentation**: prezentacja (do 10 slajdów), scenariusz demo, nagranie zapasowe, materiały zgłoszeniowe Defence
- [ ] **shared**: kontrakt integracji, pakiet treści, zestawy testowe A/B, klucz oceny, definicje pomiaru, zasady nagród

### Out of Scope

- Fake newsy — odłożone, poza zakresem MVP
- Automatyczne zgłoszenia do platform — odłożone
- Natywne aplikacje i prawdziwy widget systemowy — dalsza wersja; pomocnik nie czyta automatycznie innych aplikacji
- Wspólne logowanie z Roblox — nie budujemy
- Produkcyjne uwierzytelnianie, przypisanie dziecka do opiekuna, kontrola dostępu — wymagane przed użyciem z prawdziwymi danymi; demo używa fikcyjnych profili
- Prawdziwe dane (hasła, kody, wiadomości) — demo wyłącznie na fikcyjnych treściach
- Publiczny ranking, punkty za liczbę zgłoszeń, kary za proszenie o pomoc — niezgodne z zasadami nagród
- Dowód trwałej skuteczności szkolenia — demo pokazuje mechanizm pomiaru, nie badanie na dzieciach

## Context

- 4 osoby, ~24 h; podział: osoba 1 Roblox, osoba 2 panel opiekuna i testy, osoba 3 pomocnik/rozszerzenie/backend (właściciel kontraktu), osoba 4 treści, pomiar, prezentacja
- Pomocnik nie gwarantuje, że wiadomość jest bezpieczna; AI jest opcjonalne, reguły ustalone z góry
- Przekazanie sprawy opiekunowi i zgłoszenie moderatorom to dwie osobne czynności; dziecko przed wysłaniem widzi, co udostępnia
- Wyniki z pomocnikiem liczone osobno od testu samodzielności; import z Roblox oznacza pochodzenie
- Wyniki demo są syntetyczne i tak oznaczone
- Wyróżnik (jedna postać: trening w grze + pomoc w codziennej sytuacji + nauka samodzielnego sprawdzania) wymaga walidacji
- Wcześnie sprawdzić wymagania publikacji gry Roblox; wariant awaryjny: pokaz w Studio

## Constraints

- **Timeline**: ~24 h; kamienie milowe 2–3 h / 8 h / 12 h / 17 h / 21 h / 24 h; faktyczny deadline organizatora ma pierwszeństwo
- **Track**: Defence
- **Privacy**: tylko fikcyjne dane; nauczyciel nie widzi prywatnych spraw
- **Integracja**: backend wylicza wynik wg klucza oceny, nie przyjmuje punktów od klienta
- **Roblox**: żadnych sekretów w kliencie; automatyczny zapis wyniku jest P1
- **Priorytet przy braku czasu**: najpierw odłożyć AI, zrzuty ekranu, drugą misję, automatyczny zapis z Roblox; zachować wymianę dziecko–opiekun i pomiar przed–po

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Workstreamy: api-ui, widget, roblox, presentation | Osobne ROADMAP/STATE/fazy, żeby tory pracy się nie mieszały | — Pending |
| `.planning/shared/` na kontrakt, treści i pomiar | Jedno źródło prawdy dla wszystkich torów; właściciel edytuje, reszta czyta | — Pending |
| Widoczny rekin i otwarty panel przesuwają się razem | Zachowanie tekstu i fokusu podczas przeciągania; doprecyzowanie użytkownika | ✓ widget Phase 1, UAT pass |
| Kontrakt API prowadzi osoba 3, potwierdza osoba 2 | Zgodnie z taski.md; implementacja po potwierdzeniu | — Pending |
| Dwa zestawy testowe A/B o podobnej trudności | Test przed–po bez pomocnika, bez kopiowania scenariusza treningowego | — Pending |
| Punkty za umiejętności, nie za liczbę zgłoszeń | Unikamy zachęty do fałszywych zgłoszeń | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-03 after widget Phase 1 completion*
