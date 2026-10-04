# Phase 4: Pakiet warsztatowy dla nauczyciela — Research

**Researched:** 2026-10-03
**Method:** Claude in Chrome (zgodnie z D-17); WebFetch + pypdf tylko pomocniczo dla plików PDF i jednej domeny, której rozszerzenie nie pozwoliło czytać (cert.orange.pl).
**Scope:** (1) aktualne przykłady oszustw na dzieci (Roblox, Discord, BLIK), (2) istniejące scenariusze lekcji jako wzór formy.

## RESEARCH COMPLETE

---

## 1. Aktualne schematy oszustw (materiał na makiety)

| # | Schemat | Czerwone flagi (do ćwiczenia „detektyw”) | Źródło |
|---|---------|-------------------------------------------|--------|
| S1 | **Darmowe Robuxy / generator** — wiadomość, często z podszytego znajomego konta, z linkiem do „odbioru” | pośpiech, „darmowe”, link poza roblox.com, strona-sobowtór z literówką/inną końcówką domeny (typ `roblox.com[.]ml`), prośba o login i hasło | CERT Orange Polska, „Darmowe Robuxy? Cena: twoje konto”, 04.09.2026 (akt. 28.09.2026) |
| S2 | **Fałszywe cheaty / „executory”** | „100% bezpieczne”, „bez bana”, każą wyłączyć antywirusa, plik spoza oficjalnych źródeł | CERT Orange 2026 |
| S3 | **Plik HAR / „eksport awatara”** — oszust udaje grafika GFX i prosi o plik HAR albo wklejenie kodu do konsoli przeglądarki | prośba o plik/kod „techniczny”, którego dziecko nie rozumie; daje dostęp do konta bez hasła | CERT Orange 2026 |
| S4 | **Wymiana „na zaufanie”** — ktoś ma dać pierwszy, fałszywy pośrednik, „pożyczenie konta”, sprzedaż poza platformą | „ty pierwszy”, pośrednik, którego poleca druga strona, przejście poza grę | CERT Orange 2026 |
| S5 | **Phishing kodu 2FA / kodów zapasowych** — fałszywa „weryfikacja” | prośba o kod z SMS/aplikacji, „inaczej konto zostanie usunięte” | CERT Orange 2026 |
| S6 | **„Znajomy” prosi o BLIK** — przejęte konto kolegi/członka rodziny na komunikatorze, prośba o kod BLIK „bo bank mi zablokował” | pilność, prośba o kod/pieniądze, nietypowy styl pisania, „nie dzwoń, nie mogę rozmawiać” | CBZC, rozbicie grupy wyłudzającej BLIK, 04.02.2026; Policja Mazowiecka 09.04.2026; TVN24/TVP Kraków 05.02.2026 |
| S7 | **Przeniesienie rozmowy poza grę** (Roblox → Discord/WhatsApp), budowanie zaufania, prezenty, sekrety, prośby o zdjęcia/dane/pieniądze | „przejdźmy na Discorda”, „nie mów rodzicom”, prezenty/Robuxy w zamian, prośba o zdjęcia | NASK, „Roblox. Cyfrowe podwórko bez kontroli”, 28.05.2026 |
| S8 | **Phishing e-mail podszywający się pod szkołę/instytucję** (np. „aktualizacja legitymacji”, prośba o PESEL, adres, telefon rodzica, link w obcej domenie, termin „do jutra”) | nietypowa domena nadawcy, presja czasu, prośba o dane osobowe, link | Scenariusz PragmaGO „Nie daj się złowić!” (2025) |

**Wnioski dla treści:**
- S1, S6, S7 pokrywają się z 10 scenariuszami poradnika i scenkami B13 — używać ich jako rdzenia. S3 (HAR) jest już w D-06 (lekcja 2) i ma świeże źródło.
- NASK (2026) mówi, że ogólne „uważaj w internecie” nie działa. Lepiej uczyć konkretnych sygnałów: z kim rozmawiasz, czy ktoś przenosi rozmowę, czy prosi o dane, zdjęcia albo pieniądze. To pasuje do kart „co zrobisz?”.
- NASK: dziecko ma prawo wyjść z gry, zablokować i zgłosić, nawet gdy inni mówią „to tylko zabawa”. Mówiąc dorosłemu, nie ryzykuje kary ani utraty gry. To przekaz do podsumowań lekcji i kart do domu.
- Ramy liczbowe do wstępu (opcjonalne): Roblox ok. 150 mln graczy dziennie w 2026, ponad połowa poniżej 16 lat (NASK 2026). Ok. 7,8% nastolatków doświadczyło kradzieży dóbr wirtualnych, 8,7% oszustwa przy transakcji online (dane przytoczone w scenariuszu NASK/ZPE 2023).

## 2. Istniejące scenariusze jako wzór formy

| Materiał | Wiek / czas | Forma | Co bierzemy |
|----------|-------------|-------|-------------|
| NASK/ZPE „Zagrożenia w sieci i prywatność w Internecie” (Cyberlekcje, 2023, CC BY-NC 4.0) | kl. 4–6, 2×45 | „Warto wiedzieć” dla nauczyciela → cele + **cele w języku ucznia** + **kryteria sukcesu** → metody, formy, środki → przebieg (wprowadzenie / część główna / podsumowanie) → komentarz metodyczny, SPE → bibliografia; test ruchowy TAK/NIE (kucnij/podskocz); praca w trójkach z kartą sytuacji; hasła zbierane na A4 | Układ konspektu (D-08) uzupełnić o „cele w języku ucznia” i krótką sekcję „Warto wiedzieć”. Test ruchowy TAK/NIE jako rozgrzewka bez komputerów |
| PragmaGO „Nie daj się złowić!” (phishing, 2025) | kl. 4–6, 45 min | org. 2 / wprowadzenie 7 / praca 35 / podsumowanie 3 (+ quiz); analiza fałszywego maila na tablicy z listą flag; quiz „podejrzane vs bezpieczne” | Gotowy rozkład minut i lista flag dla maila. **Odrzucamy** elementy wymagające komputera (emkei.cz, fałszywa strona FB, LearningApps), sprzeczne z D-15. Zamiast tego: makieta drukowana/na rzutniku + sortowanie kart „podejrzane/bezpieczne” |
| FDDS „3… 2… 1… Internet!” | kl. 4–6, 2×45 | kreskówki + łamigłówki + praca grupowa; strona z telefonami pomocowymi | Strona „gdzie szukać pomocy”: **116 111** (Telefon Zaufania dla Dzieci i Młodzieży), **800 100 100** (telefon dla rodziców i nauczycieli). Godziny podane w starym PDF mogą być nieaktualne, więc numery i godziny brać z sekcji kontaktów w `poradnik.html` (już zweryfikowane w quick 261003-vel) |
| FDDS „Uważni online” | 12–15 lat, 45 min | cel: uwodzenie w sieci, weryfikowanie kontaktów online, zachęta do szukania pomocy | Potwierdza temat lekcji 3 i nacisk na proszenie o pomoc. Pełny scenariusz za logowaniem, nie pobierany |
| Europol „Cyber Defenders” (gra w Roblox, fact sheet) | 8–12 lat, 45–60 min | scenariusze decyzyjne („dostajesz podejrzany link — co robisz?”), zagadki „znajdź zagrożenie”, debriefing z pytaniami; zestaw: plakat „10 zasad”, list do rodziców | Forma kart decyzji (D-10) i karta do domu jako odpowiednik listu do rodziców. **Nie** wymagamy gry (D-15) |

### 2a. Z pobranych PDF-ów (na prośbę użytkownika, otwarte z odwiedzonych stron)

- **FDDS „Uważni online”, pełny scenariusz (PDF, 4 s., 2017, CC BY-NC-ND 3.0 PL).** Rozkład: wstęp 1 min → dyskusja 12 → film 2+10 → burza mózgów „instrukcja bezpieczeństwa” 12 → „gdzie szukać pomocy” 7 → podsumowanie 1. Do wzięcia:
  - **Zasady na początek zajęć** (słucham, nie oceniam, szanuję i nie rozpowiadam tego, co powiedzą inni, angażuję się). Dodać jako krótki blok „Umowa na lekcję” w każdym konspekcie.
  - Pytania „dlaczego ktoś wchodzi w taką relację?” (samotność, potrzeba bycia docenionym) normalizują sytuację bez obwiniania ofiary. Przydatne w lekcji 3.
  - **Zakończenie:** „jeśli nie chcesz mówić przy klasie, porozmawiaj ze mną albo z pedagogiem po lekcji”. To dokładnie ramka ujawnienia z D-13; użyć tego sformułowania w podsumowaniu każdej lekcji.
  - Kolejność szukania pomocy: rodzic → inny zaufany dorosły (pedagog, psycholog, nauczyciel, rodzina) → 116 111 (bezpłatny, anonimowy).
  - **Nie przenosić:** część o „weryfikacji kamerką” i „bezpiecznym spotkaniu” (scenariusz jest dla 12–15 lat). Dla klas 4–8 komunikat brzmi: nie spotykaj się z osobą znaną tylko z internetu, powiedz dorosłemu.
- **NASK/ZPE, karta pracy „Zagrożenia w sieci” (PDF, 3 s.).** Karta to **materiał do pocięcia**: 6 krótkich sytuacji (phishing, ukryte koszty, kontakty z obcymi graczami, kradzież tożsamości, wizerunek, linki na czacie). Każda trójka dostaje jedną, mówi, dlaczego to niebezpieczne, i proponuje zasadę na A4. Wniosek: karty decyzji „co zrobisz?” robić jako arkusz do pocięcia (np. 6 kart na A4, linia cięcia) w czerni i bieli. Ankieta z ćw. 2 nie pasuje do D-15, pomijamy.
- **NASK „Zagrożenia w sieci” (gov.pl, PDF, 19 s., 2021, szkoła ponadpodstawowa).** Ten sam układ co Cyberlekcje: „Warto wiedzieć”, cele, metody, przebieg, **komentarz metodyczny („Uwagi do realizacji”, SPE)**, potem **karty pracy jako kolejne strony na końcu**, każda „cz. N” na osobnej stronie, na końcu bibliografia. To potwierdza układ D-04/D-08: konspekt, za nim karty, każda na osobnej stronie. Warto dodać krótką ramkę „Uwagi do realizacji / uczniowie z SPE” (1–3 zdania), np. pary mieszane, czytanie makiet na głos.

**Wnioski dla struktury:**
- Każda lekcja: ~2 min organizacja, ~5–8 min wprowadzenie (rozgrzewka TAK/NIE bez sprzętu), ~25–30 min ćwiczenia (detektyw w parach + karty decyzji lub scenka), ~5 min quiz (3–5 pytań, bez ocen, D-12), ~3 min podsumowanie i karta do domu.
- Wszystkie scenariusze wzorcowe mają bibliografię/netografię, co potwierdza D-17 (strona ze źródłami w pakiecie).
- Żaden z wzorców nie ma ~1/3 uczciwych przykładów. To wyróżnik pakietu (D-11); warto go nazwać na stronie „Jak korzystać z pakietu”.

## 3. Ograniczenia i ryzyka

- Makiety nie mogą używać prawdziwych logo ani prawdziwych domen (D-05). Domeny-sobowtóry pisać jako fikcyjne z `[.]`, np. `robIox-nagrody[.]example`. Nie kopiować realnych URL-i z artykułów.
- Scenki uczą reakcji, nie wykonania (D-14). S3 (HAR/konsola) opisywać tylko jako „ktoś prosi o plik/kod, którego nie rozumiesz → nie wysyłaj, powiedz dorosłemu”, bez wyjaśniania, jak plik wygenerować.
- Licencja NASK/ZPE to CC BY-NC 4.0. Inspirujemy się formą, nie kopiujemy tekstu. W źródłach podać autora i licencję.
- Część źródeł to artykuły z 2026, więc w bibliografii podać daty dostępu (2026-10-03).

## 4. Źródła (do strony „Źródła” w pakiecie)

1. NASK PIB, „Roblox. Cyfrowe podwórko bez kontroli”, 28.05.2026 — nask.pl/aktualnosci/roblox-cyfrowe-podworko-bez-kontroli
2. CERT Orange Polska, „Darmowe Robuxy? Cena: twoje konto”, 04.09.2026 — cert.orange.pl/aktualnosci/oszustwa-na-robloxie/
3. CBZC, komunikat o rozbiciu grupy wyłudzającej pieniądze kodami BLIK, 04.02.2026 — cbzc.policja.gov.pl
4. KSP / Policja Mazowiecka, „Znajomy z Messengera prosi o kod BLIK?”, 09.04.2026 — mazowiecka.policja.gov.pl
5. NASK / ZPE, Cyberlekcje 3.0: „Zagrożenia w sieci i prywatność w Internecie”, scenariusz kl. 4–6, 2023, CC BY-NC 4.0 — zpe.gov.pl
6. PragmaGO / Cyfrowy Skaut, „Nie daj się złowić! — scenariusz lekcji: phishing”, kl. 4–6, 2025 — cdn.pragmago.pl
7. Fundacja Dajemy Dzieciom Siłę, „3… 2… 1… Internet!” scenariusz kl. IV–VI — edukacja.fdds.pl
8. Fundacja Dajemy Dzieciom Siłę, „Uważni online” scenariusz 12–15 lat — edukacja.fdds.pl
9. Europol, „Cyber Defenders: Fact sheet” — europol.europa.eu
10. NASK PIB, „Zagrożenia w sieci”, scenariusz dla szkół ponadpodstawowych, 2021, CC BY-NC 4.0 — gov.pl (załącznik PDF)
11. Wewnętrzne: `ideas/defence/research.md` (§A3, §B8, §B9, §B13), `projects/presentation/poradnik/poradnik.html`

Dostęp do wszystkich: 2026-10-03.
