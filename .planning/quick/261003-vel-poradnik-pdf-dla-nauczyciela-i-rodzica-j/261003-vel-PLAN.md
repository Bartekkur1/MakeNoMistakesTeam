---
quick_id: 261003-vel
slug: poradnik-pdf-dla-nauczyciela-i-rodzica-j
date: 2026-10-03
---

# Poradnik PDF dla rodzica i nauczyciela

Cel: jeden plik PDF, który mówi opiekunowi i nauczycielowi, co robić w najczęstszych
scenariuszach, które obsługuje BezpiecznaAura, i jak trwale zneutralizować zagrożenie
(zgłoszenie do CERT Polska, platformy, banku, Policji, profilaktyka).

## Źródła
- `ideas/defence/research.md` (A3 schematy, B8 kanały, B10 instytucje, B13 scenki)
- `.planning/PROJECT.md` (co robi produkt, podział ról opiekun / nauczyciel)
- `slides/style.css` (paleta)

## Zadania
1. Źródło HTML do druku A4: `projects/presentation/poradnik/poradnik.html`
   - pierwsze 5 minut (zasady uniwersalne), kontakty, 9 scenariuszy w stałym układzie
     (jak wygląda → co teraz → jeśli już się stało → gdzie zgłosić → na przyszłość),
     zgłoszenie do CERT krok po kroku, Policja, rozdział dla nauczyciela,
     profilaktyka, rozmowa z dzieckiem, karta szybkiej reakcji.
2. Render do `projects/presentation/poradnik/poradnik-bezpieczna-aura.pdf` (Edge headless).
3. Sprawdzenie PDF (liczba stron, podgląd stron, łamanie).

Bez commita (zasada zespołu: commit tylko na prośbę).
