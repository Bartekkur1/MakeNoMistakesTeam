---
quick_id: 261003-vel
status: complete
date: 2026-10-03
---

# Podsumowanie: poradnik PDF dla rodzica i nauczyciela

## Wynik
- `projects/presentation/poradnik/poradnik.html` — źródło (HTML do druku A4, paleta ze `slides/style.css`, maskotka z `assets/`).
- `projects/presentation/poradnik/poradnik-bezpieczna-aura.pdf` — 19 stron A4.

## Zawartość
Okładka ze spisem treści; pierwsze 5 minut; tabela kontaktów (112, Policja, incydent.cert.pl,
SMS 8080, Dyżurnet, 116 111, 800 100 100, bank / 828 828 828, mObywatel, Roblox, Discord,
Rzecznik Finansowy / UOKiK); 10 scenariuszy w stałym układzie (jak wygląda → co teraz →
jeśli już się stało → gdzie zgłosić → na przyszłość); zgłoszenie do CERT krok po kroku
z przykładowym opisem; Policja (przykładowe artykuły k.k.); rozdział dla nauczyciela
(standardy ochrony małoletnich); lista kontrolna profilaktyki i umowa rodzinna; rozmowa
z dzieckiem; jednostronicowa karta szybkiej reakcji.

## Weryfikacja
Render przez Edge headless; podgląd stron 1, 3, 12, 16, 19 — każda sekcja mieści się na
jednej stronie, brak przepełnień.

## Regeneracja PDF
```
msedge --headless=new --no-pdf-header-footer --allow-file-access-from-files \
  --print-to-pdf=poradnik-bezpieczna-aura.pdf file:///.../poradnik.html
```

Bez commita (na prośbę zespołu).
