# Czujny Senior – brief na konsultację z mentorem

*2026-10-03 · HackYeah 2026, Kraków · ścieżka Defence · nazwa robocza*

## Podsumowanie

Budujemy polskojęzyczny portal, który wygląda jak zwykły serwis informacyjny, a po włączeniu trybu analizy podświetla każdą manipulację, oszustwo i fake news, żeby seniorzy uczyli się je rozpoznawać na żywym przykładzie. Do portalu dochodzi nieskończona gra „Fake czy nie?" na stronach banków, kurierów i newsów. Zgłaszamy projekt do ścieżki **Defence**; to jeden projekt, bez CTF i konkursów pobocznych. Nazwa „Czujny Senior" jest robocza i zmienia się w jednym miejscu konfiguracji.

## Problem

- Seniorzy są głównym celem oszustów i dezinformacji: fałszywych stron banków i kurierów, reklam z twarzą celebryty, newsów podsycających strach i niechęć do obcych. Nie dorastali z internetem, więc trudniej im zauważyć haczyk.
- Edukacja, która do nich trafia, to najczęściej ulotki i wykłady. Mówią „uważaj", ale nie pozwalają poćwiczyć na żywym przykładzie.
- **Do zweryfikowania przed pitchem:** twarde dane (raporty CERT Polska, policyjne statystyki oszustw na seniorach). Nie wpisujemy liczb z pamięci; research z cytowanymi źródłami jest częścią projektu.

## Rozwiązanie

### Część 1: portal z „trybem podglądu intencji"

- Strona wygląda jak zwykły portal informacyjny; w normalnym trybie nic nie budzi podejrzeń.
- Przycisk włącza tryb analizy: ta sama strona, ale każdy kafelek, nagłówek, zdjęcie i reklama dostaje kolorową nakładkę według grupy: **manipulacja w newsie**, **oszustwo**, **fake news**.
- Przy każdym elemencie jest stale widoczna plakietka z nazwą techniki (nie zależy od najechania myszą). Kolor ma dodatkowo ikonę lub wzór, żeby nie był jedynym sygnałem.
- Klik otwiera panel boczny z wyjaśnieniem i linkiem „Czytaj więcej"; opcjonalnie jednozdaniowy podgląd po najechaniu.
- Część artykułów jest rzetelna i w trybie analizy zostaje „czysta", żeby senior uczył się odróżniać manipulację od informacji, a nie wynosił wniosek, że żadnemu medium nie wolno ufać.
- Pełne artykuły: tryb analizy działa też wewnątrz, akapity z manipulacją są podświetlone, na marginesie jest krótki opis techniki.
- Fałszywe reklamy umieszczone tam, gdzie na prawdziwych portalach; w trybie analizy podświetlone jak kafelki.
- **Strona „Czytaj więcej"** (jeden układ dla każdej techniki): (1) co to jest i dlaczego działa na emocje, (2) ten sam news w wersji uczciwej obok zmanipulowanej, (3) 2–3 pytania „jak się bronić".
- **„Zgłoś artykuł":** pełny edytor, w którym każdy (bez konta) pisze artykuł, zaznacza akapity z manipulacją i wybiera techniki z listy. Moderator sprawdza tekst i oznaczenia, artykuł pojawia się dopiero po akceptacji.

### Część 2: gra „Fake czy nie?"

- Senior dostaje stronę i decyduje: fake czy prawda. Po każdej decyzji dostaje dokładne wyjaśnienie, gdzie i jak to rozpoznać, albo dlaczego strona jest w porządku. Gra nie ma końca.
- Pula mieszana: bank ze zmienionym adresem URL, kurier („dopłać 1,99 zł"), sklep, OLX, ZUS/urząd, poczta, SMS-y oraz newsy z części 1.
- Wyjaśnienie używa tej samej mechaniki co tryb analizy (podświetlenie, krótki opis, „Czytaj więcej"), więc obie części dzielą jeden sposób tłumaczenia i te same podstrony technik.
- Statystyki i postępy trzymamy w localStorage przeglądarki (przetrwają restart, bez kont, dane per urządzenie).

### Dodatki

- **„Co zrobić, gdy…":** krótkie instrukcje krok po kroku na moment paniki (kliknąłem w link, podałem dane karty, przelałem pieniądze, ktoś dzwonił „z banku/policji", SMS o dopłacie, uwierzyłem w fałszywą informację). Typowe kroki: zadzwonić do banku i zablokować kartę lub konto, zastrzec PESEL, zgłosić na policję (112), przekazać SMS na 8080, zgłosić stronę na incydent.cert.pl. *Numery i procedury do weryfikacji w researchu.*
- Słowniczek manipulacji (wszystkie podstrony „Czytaj więcej" w jednym miejscu).
- Tryb dużej czcionki i kontrastu.
- Materiały dla prowadzących: gotowy scenariusz warsztatu i karta do wydruku z pytaniami „jak się bronić".

## Plan pokazu dla jury

1. Pokazujemy zwykły portal: czołówka, artykuły, reklamy, nic nie budzi podejrzeń.
2. Włączamy tryb analizy: strona „zapala się" kolorami, uczciwe artykuły zostają czyste.
3. Otwieramy artykuł z podświetlonym akapitem i przechodzimy do „Czytaj więcej": wersja uczciwa obok zmanipulowanej.
4. Gra: jurorzy oceniają stronę banku z podmienionym adresem; większość się nabiera i od razu widzi haczyk.
5. Na koniec „Co zrobić, gdy…" i edytor dla społeczności jako droga do skalowania treści.

## Zakres na ~24h i podjęte decyzje

| Obszar | Decyzja |
|---|---|
| Czas i zespół | ~24h, mały zespół; cały 5-krokowy pokaz ma działać na żywo |
| Platforma | Komputer w pierwszej kolejności; tablet później |
| Konta | Brak kont i logowania |
| Statystyki gry | localStorage w przeglądarce |
| Treści i kolejka moderacji | Backend z bazą danych (wspólne dla wszystkich) |
| Moderacja | Panel pod ukrytym URL, bez logowania: lista oczekujących, Akceptuj / Odrzuć |
| Treści startowe | ~10 fikcyjnych artykułów + strony do gry, własna zmyślona marka, bez podszywania się pod istniejące media |
| Strony do gry | Szablony HTML/komponenty (interaktywne podświetlanie, łatwe generowanie wariantów) |
| Skalowanie treści | Treści jako dane ustrukturyzowane (JSON/Markdown ze schematem); agent AI generuje nowe, człowiek weryfikuje |
| Interakcja z kafelkiem | Plakietka zawsze widoczna + klik w panel boczny (+ opcjonalny podgląd po najechaniu) |
| Fakty i statystyki | Research z cytowanymi źródłami (CERT Polska, policja) |
| Nazwa | Robocza, zmieniana w jednym miejscu konfiguracji |

**Odkładamy:** przycisk „Wyślij to wnuczkowi" (zapytanie zaufanej osoby, czy coś jest prawdą), wersję tablet/mobile, prawdziwe konta i role.

## Ryzyka i założenia

- **Zakres vs 24h:** dwie części, edytor z moderacją i dodatki to dużo. Zabezpieczenie: treści startowe generowane agentem, edytor i moderacja w wersji prostej.
- **Jakość treści:** artykuły i strony do gry muszą być wiarygodne i poprawnie opisane. Zabezpieczenie: człowiek weryfikuje każdą treść generowaną przez agenta.
- **Fakty i numery pomocy:** nie wpisujemy niczego z pamięci; wszystko z cytowanym źródłem.
- **Moderacja bez kont:** ukryty URL to wystarczające zabezpieczenie na demo, ale nie na produkcję.
- **Treści z edytora:** każdy może zgłosić artykuł, więc nic nie trafia na stronę bez akceptacji moderatora.
- **Dostępność:** seniorzy mogą mieć słabszą precyzję myszy i wzrok; stąd plakietki niezależne od hovera, ikony obok koloru i tryb dużej czcionki.
- **Założenia do potwierdzenia:** artykuły są fikcyjne i pisane przez nas wzorem prawdziwych technik; „element" to nie tylko treść artykułu, ale też nagłówki, zdjęcia, reklamy i „zobacz też"; portal jest po polsku.

## Pytania do mentora

1. Czy zakres (portal + gra + edytor z moderacją + dodatki) jest realny na ~24h, a jeśli nie, co ciąć najpierw bez utraty efektu na jury?
2. Czy mocniej wypada pokaz „trybu analizy" czy gry jako główny moment pokazu?
3. Jak najlepiej uzasadnić dopasowanie do ścieżki Defence (dezinformacja i odporność na oszustwa)?
4. Czy edytor społeczności z moderacją to dobry argument za skalowalnością, czy lepiej pokazać go tylko jako wizję?
5. Czy znacie wiarygodne źródła i dane o oszustwach na seniorach (CERT Polska, policja), które warto zacytować w pitchu?
6. Jak mierzyć sukces po hackathonie (np. wdrożenie w bibliotekach, UTW, klubach seniora)?
7. Jak najlepiej testować produkt z seniorami, jeśli nie zdążymy w trakcie wydarzenia?
