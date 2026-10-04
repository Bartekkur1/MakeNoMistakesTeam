# Phase 3: Przekazanie opiekunowi i błędy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-04
**Phase:** 03-przekazanie-opiekunowi-i-b-dy
**Areas discussed:** Moment wysyłki i podgląd, Pola zgłoszenia, Logowanie rodzica we wtyczce, Status i zgłoszenie na platformie, Adres backendu, Teksty statusów, Strona opcji, Aktualizacja dokumentów

**Uwagi użytkownika przy wyborze obszarów:** „upewnij się, że używasz dokumentów gsd z api, żeby utrzymać kontrakt. Dodaj też logowanie do konta rodzica takie samo jak w apce webowej na pierwsze uruchomienie pluginu. sesja ma się nie kończyć”

---

## Moment wysyłki i podgląd

| Option | Description | Selected |
|--------|-------------|----------|
| Z ekranu wyniku | Pokaż opiekunowi → podgląd → Wyślij; attack_type z odpowiedzi | ✓ |
| Przy „Zatwierdzam” (faza 1) | POST przed pytaniami; brak możliwości dopisania wyniku | |
| Dziecko wybiera w dowolnej chwili | Przycisk na podglądzie i wyniku | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dokładne pola z etykietami | Treść+link, rodzaj, działania, źródło, zdanie o braku wyniku | ✓ |
| Pola + edycja na podglądzie | Pełna edycja w podglądzie | |
| Tylko treść + odbiorca | Krócej, niezgodne z „dokładnie” | |

| Option | Description | Selected |
|--------|-------------|----------|
| Potwierdzenie + stan zostaje | Odbiorca, czas, status; blokada ponownej wysyłki | ✓ |
| Potwierdzenie i czyszczenie | Powrót do menu | |

| Option | Description | Selected |
|--------|-------------|----------|
| Rozróżnione komunikaty + ręczne ponowienie | Brak sieci / nie wysłano / nie wiemy czy dotarło | ✓ |
| Health-check przed wysyłką | GET /api/health przed POST | |
| Jeden ogólny komunikat | Bez rozróżnienia | |

## Pola zgłoszenia

| Option | Description | Selected |
|--------|-------------|----------|
| Wyliczony, do poprawienia | Reguła z odpowiedzi, zmiana na podglądzie | ✓ |
| Dziecko wybiera samo | 6 opcji bez podpowiedzi | |
| Wyliczony, bez zmiany | Najkrócej | |

| Option | Description | Selected |
|--------|-------------|----------|
| Checkboxy na podglądzie | Wg ACTIONS_BY_ATTACK_TYPE | ✓ |
| Osobny krok przed podglądem | Dodatkowy ekran | |
| Nie zbierać | Zawsze [] | |

| Option | Description | Selected |
|--------|-------------|----------|
| Z hosta + link w treści | Lista do poprawienia; „Link: …” w content | ✓ |
| Dziecko wybiera źródło | Bez wstępnego zaznaczenia | |
| Prośba o pole link w kontrakcie | Zmiana backendu | |

## Logowanie rodzica we wtyczce

| Option | Description | Selected |
|--------|-------------|----------|
| Karta po instalacji | Strona rozszerzenia jak web-app, też jako opcje | ✓ |
| W oknie przy rekinie | Logowanie w małym oknie | |

| Option | Description | Selected |
|--------|-------------|----------|
| Ciche ponowne logowanie | E-mail+kod w chrome.storage.local, re-login przy 401 | ✓ |
| Zmiana kontraktu: token bez wygaśnięcia | Wymaga web-app | |
| 12 h, potem logowanie | Zgodnie z kontraktem | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sprawdzanie działa, wysyłka nie | Komunikat + link do logowania | ✓ |
| Rekin blokuje się do zalogowania | | |

**Notes:** „Takie samo jak w web-app” obejmuje okno „Zobacz konta demo” (potwierdzone przejściem dalej).

## Status i zgłoszenie na platformie

| Option | Description | Selected |
|--------|-------------|----------|
| Status jako odpowiedź | „Moje zgłoszenia” z GET /api/reports | ✓ |
| Prośba o pole odpowiedzi w kontrakcie | Odwraca D-11 web-app | |
| HND-03 do v2 | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Osobny przycisk na wyniku, wg źródła | Linki z „Gdzie zgłosić” web-app | ✓ |
| Instrukcja w potwierdzeniu wysyłki | | |
| Ogólna instrukcja | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Początek treści + rodzaj + data + status | Ostatnie 10 | ✓ |
| Bez treści | | |

## Dodatkowe obszary

| Pytanie | Wybór |
|---------|-------|
| Adres backendu | Przy budowaniu, domyślnie demo (alternatywa: pole na stronie opcji) |
| Teksty statusów | Spokojne, bez oceny (alternatywa: etykiety z kontraktu) |
| Strona opcji | Konto + Wyloguj, bez ochrony (alternatywa: kod przed wylogowaniem) |
| Dokumenty | REQUIREMENTS + notatka do web-app (alternatywa: tylko REQUIREMENTS) |

## Claude's Discretion

- Architektura klienta API/sesji w service workerze, timeouty, klasyfikacja błędów.
- Priorytety reguły attack_type, listy hostów dla source.
- Dokładne teksty i układ podglądu.

## Deferred Ideas

- Pole link i odpowiedź do dziecka w kontrakcie.
- Token wtyczki bez wygaśnięcia po stronie backendu.
- Sygnały/wynik w zgłoszeniu (D-13 web-app).
