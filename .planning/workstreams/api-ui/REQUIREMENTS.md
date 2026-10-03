# Requirements: Cyberpomocnik — workstream api-ui

**Defined:** 2026-10-03
**Core Value:** Sprawa wysłana przez dziecko trafia do opiekuna, odpowiedź wraca, a test przed–po daje policzalne wyniki.
**Scope:** backend (osoba 3, W1) + panel opiekuna i ekran testów (osoba 2, O1–O6). Kontrakt: `.planning/shared/CONTRACT.md`.

## v1 Requirements

### Backend

- [ ] **API-01**: Opiekun i widget mogą utworzyć, wylistować i pobrać szczegóły sprawy przez API; zapisy przeżywają odświeżenie
- [ ] **API-02**: Opiekun może dodać odpowiedź do sprawy i zmienić status (nowa → w rozmowie → zakończona)
- [ ] **API-03**: Klient może zapisać odpowiedzi testowe; backend liczy wynik według klucza z `shared/content/`, a nie według punktów od klienta
- [ ] **API-04**: Wyniki z oznaczonym pochodzeniem (origin) można zapisać i odczytać; trening i test samodzielności nie mieszają się
- [ ] **API-05**: Widok nauczyciela zwraca tylko zagregowane wyniki, nigdy prywatne sprawy

### Panel opiekuna

- [ ] **PAN-01**: Opiekun widzi listę nowych i zakończonych spraw fikcyjnego dziecka (data, źródło, krótki opis)
- [ ] **PAN-02**: Opiekun widzi szczegóły sprawy: treść, sygnały, działanie dziecka i odpowiedź na „Czy już kliknąłeś, podałeś dane lub zapłaciłeś?”
- [ ] **PAN-03**: Opiekun wysyła odpowiedź i zmienia status; odpowiedź pojawia się u dziecka
- [ ] **PAN-04**: Demo ma fikcyjne profile dziecka i opiekuna z oznaczonym, demonstracyjnym przełączaniem ról

### Test i wyniki

- [ ] **TST-01**: Uczestnik przechodzi test przed–po na przykładach z `shared/content/`; w trybie testu pomocnik jest wyłączony, wyjaśnienia po zakończeniu
- [ ] **TST-02**: Panel klasy pokazuje liczbę uczestników, trafność przed–po i niepotrzebne alarmy; przy braku odpowiedzi „brak danych”
- [ ] **TST-03**: Wyniki demo są oznaczone jako syntetyczne
- [ ] **TST-04**: Panel i test działają na prawdziwych zapisach backendu (po fazie na danych przykładowych)

## v2 Requirements

- **API-V2-01**: Filtrowanie spraw i eksport zagregowanych wyników
- **API-V2-02**: Wizualizacja postępu według typu zagrożenia
- **API-V2-03**: Produkcyjne uwierzytelnianie i przypisanie dziecka do opiekuna

## Out of Scope

| Feature | Reason |
|---------|--------|
| Wspólne logowanie z Roblox | Poza zakresem MVP |
| Zgłoszenia do platform | Odłożone; osobne od przekazania opiekunowi |
| Publiczny ranking | Niezgodne z zasadami nagród |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 3 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| PAN-01 | Phase 2 | Pending |
| PAN-02 | Phase 2 | Pending |
| PAN-03 | Phase 2 | Pending |
| PAN-04 | Phase 2 | Pending |
| TST-01 | Phase 3 | Pending |
| TST-02 | Phase 3 | Pending |
| TST-03 | Phase 3 | Pending |
| TST-04 | Phase 4 | Pending |

**Coverage:** v1: 13 total, mapped: 13, unmapped: 0 ✓

---
*Requirements defined: 2026-10-03*
