# Requirements: Cyberpomocnik — workstream roblox

**Defined:** 2026-10-03
**Core Value:** Misję można przejść od początku do końca: błędna i poprawna decyzja, wyjaśnienie, powtórka, wynik.
**Scope:** jedna misja Roblox (osoba 1, R1–R6). Treści: `.planning/shared/content/`; punktacja i nagrody: `.planning/shared/MEASUREMENT.md`; format wyniku: `.planning/shared/CONTRACT.md`.

## v1 Requirements

### Uruchomienie

- [x] **RBX-01**: Projekt Studio jest gotowy; ograniczenia publikacji gry rozpoznane do 2 h; pokaz w Studio jako wariant awaryjny

### Misja

- [x] **MIS-01**: Mały level: start, spotkanie z NPC, podejrzana oferta, decyzja, zakończenie (bez rozbudowanej mapy)
- [x] **MIS-02**: Wybory i konsekwencje: sprawdzenie oferty, fikcyjne przekazanie kodu, odmowa, prośba o pomoc; nigdy prawdziwe hasło ani kod
- [x] **MIS-03**: Pomocnik wyjaśnia prośbę o kod, presję czasu i obietnicę nagrody zgodnie z treściami osoby 4; błąd umożliwia ponowną próbę
- [x] **MIS-04**: Misję można odtworzyć od początku
- [x] **MIS-05**: Scamerino ma spójny model 3D; tors nie wygląda jak przypadkowy kwadrat, pasuje do głowy i kończyn, a model zachowuje wygląd podczas chodzenia
- [x] **MIS-06**: Scammer chodzi po mapie i podchodzi do gracza; zatrzymuje się w odległości umożliwiającej rozmowę, bez wchodzenia w gracza i przenikania przez przeszkody
- [x] **MIS-07**: Wybranie pomocy Scamerino w dialogu uruchamia jego podejście do gracza, po którym pomocnik udziela wskazówek; powtórka resetuje zachowanie obu NPC

### Wynik i nagroda

- [ ] **SCR-01**: Jakościowy wynik bez punktów: końcowa bezpieczna odmowa zalicza ćwiczenie niezależnie od pomocy i błędów quizu, a eksport odnotowuje użycie pomocy
- [ ] **SCR-02**: Jedna kosmetyczna nagroda za ukończenie ćwiczenia; bez nagradzania rzeczywistych zgłoszeń
- [ ] **SCR-03**: Po każdej zakończonej próbie serwer Roblox automatycznie wysyła oznaczony jako ćwiczenie wynik do backendu zgodnie z kontraktem, bez sekretu w kliencie i bez duplikatów przy ponowieniach

## v2 Requirements

- **RBX-V2-02**: Drugi wariant pułapki lub dodatkowa nagroda kosmetyczna

## Out of Scope

| Feature | Reason |
|---------|--------|
| Wspólne logowanie z Roblox | Poza zakresem MVP |
| Zbieranie prawdziwych haseł/kodów | Tylko fikcyjne dane |
| Nagrody za liczbę prawdziwych zgłoszeń | Niezgodne z zasadami nagród |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RBX-01 | Phase 1 | Complete for Studio demo; publication NO-GO, two-hour deadline missed |
| MIS-01 | Phase 1 | Complete for desktop demo; user-confirmed, mobile testing deferred |
| MIS-02 | Phase 2 | Complete |
| MIS-03 | Phase 2 | Complete |
| MIS-04 | Phase 2 | Complete |
| MIS-05 | Phase 2 | Complete |
| MIS-06 | Phase 2 | Complete |
| MIS-07 | Phase 2 | Complete |
| SCR-01 | Phase 3 | Pending |
| SCR-02 | Phase 3 | Pending |
| SCR-03 | Phase 3 | Pending |

**Coverage:** v1: 11 total, mapped: 11, unmapped: 0 ✓

---
*Requirements defined: 2026-10-03*
