# Requirements: Cyberpomocnik — workstream roblox

**Defined:** 2026-10-03
**Core Value:** Misję można przejść od początku do końca: błędna i poprawna decyzja, wyjaśnienie, powtórka, wynik.
**Scope:** jedna misja Roblox (osoba 1, R1–R6). Treści: `.planning/shared/content/`; punktacja i nagrody: `.planning/shared/MEASUREMENT.md`; format wyniku: `.planning/shared/CONTRACT.md`.

## v1 Requirements

### Uruchomienie

- [ ] **RBX-01**: Projekt Studio jest gotowy; ograniczenia publikacji gry rozpoznane do 2 h; pokaz w Studio jako wariant awaryjny

### Misja

- [ ] **MIS-01**: Mały level: start, spotkanie z NPC, podejrzana oferta, decyzja, zakończenie (bez rozbudowanej mapy)
- [ ] **MIS-02**: Wybory i konsekwencje: sprawdzenie oferty, fikcyjne przekazanie kodu, odmowa, prośba o pomoc; nigdy prawdziwe hasło ani kod
- [ ] **MIS-03**: Pomocnik wyjaśnia prośbę o kod, presję czasu i obietnicę nagrody zgodnie z treściami osoby 4; błąd umożliwia ponowną próbę
- [ ] **MIS-04**: Misję można odtworzyć od początku

### Wynik i nagroda

- [ ] **SCR-01**: Punktacja według wspólnych zasad; wynik zawiera użycie podpowiedzi
- [ ] **SCR-02**: Jedna kosmetyczna nagroda za ukończenie ćwiczenia; bez nagradzania rzeczywistych zgłoszeń
- [ ] **SCR-03**: Eksport/zapis wyniku zgodny z kontraktem; import ręczny oznaczony w demo

## v2 Requirements

- **RBX-V2-01**: Automatyczne wysyłanie wyniku do backendu z serwera Roblox, bez sekretów w kliencie
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
| RBX-01 | Phase 1 | Pending |
| MIS-01 | Phase 1 | Pending |
| MIS-02 | Phase 2 | Pending |
| MIS-03 | Phase 2 | Pending |
| MIS-04 | Phase 2 | Pending |
| SCR-01 | Phase 3 | Pending |
| SCR-02 | Phase 3 | Pending |
| SCR-03 | Phase 3 | Pending |

**Coverage:** v1: 8 total, mapped: 8, unmapped: 0 ✓

---
*Requirements defined: 2026-10-03*
