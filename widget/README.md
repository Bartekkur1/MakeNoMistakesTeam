# BezpiecznaAura – rozszerzenie Scamerinio (faza 1)

Scamerinio pomaga dziecku przekazać wybraną wiadomość do sprawdzenia. Zaznacz tekst i kliknij rekina albo wybierz „Sprawdź wiadomość” i wklej tekst oraz opcjonalny link. Podgląd pozwala usunąć dane, zmienić tekst i świadomie zatwierdzić. „Jak to działa” wyjaśnia trzy kroki i prywatność.

Podczas wklejania i podglądu wiadomości rekin oraz jego przycisk schowania znikają, a formularz pozostaje widoczny. Po zamknięciu formularza przez × lub Escape rekin wraca na swoje miejsce; ponowne kliknięcie otwiera zachowany szkic. W menu, „Jak to działa” i „Gotowe!” rekin pozostaje widoczny.

Faza 1 kończy się utworzeniem sprawy w pamięci service workera. Nie ma jeszcze analizy, pytań, API ani wysyłki do opiekuna. „Gotowe!” oznacza przygotowanie sprawy do sprawdzenia. Implementacja obejmuje decyzje D-01–D-18 dotyczące rozszerzenia, dostępu do treści, obecności awatara i szkicu.

## Budowanie

W katalogu `widget/`:

```sh
npm ci
npm run build
```

Wynik: `widget/dist/`. Zależności są przypięte w lockfile; wykonanie tej fazy nie dodaje ani nie aktualizuje pakietów.

## Uruchomienie w Google Chrome

1. Otwórz `chrome://extensions` i włącz **Tryb dewelopera**.
2. Kliknij **Załaduj rozpakowane** i wskaż `widget/dist`.
3. Otwórz zwykłą stronę HTTP(S). Rekin pojawi się w prawym dolnym rogu. Możesz go przeciągnąć lub schować przyciskiem ×; ikona rozszerzenia przywraca go na tej karcie.
4. Po każdym przebudowaniu kliknij przeładowanie na karcie rozszerzenia i odśwież kartę demo. Jeśli karta nie została odświeżona, kliknięcie ikony na pasku zastępuje osieroconego rekina działającą instancją.

Chrome ogranicza działanie rozszerzeń m.in. na stronach `chrome://`, Chrome Web Store i w swoim podglądzie PDF. Demo dotyczy Google Chrome i Discorda w przeglądarce, nie aplikacji Discord na komputerze lub telefonie.

## Testy

```sh
npm test
npm run test:e2e
```

Vitest używa happy-dom z przetwarzaniem rzeczywistego CSS. Testy D-04 pilnują miejsc odczytu i wysyłki, listenerów, uprawnień i zakazu zapisu treści. Playwright uruchamia rozszerzenie w lokalnym `/usr/bin/chromium`, jeśli jest dostępne.

- `AURA_CHROMIUM=bundled npm run test:e2e` wybiera Chromium Playwrighta (po `npx playwright install chromium`).
- `AURA_CHROMIUM=/ścieżka/do/chromium npm run test:e2e` wybiera konkretny plik wykonywalny.
- `AURA_HEADED=1 npm run test:e2e` otwiera widoczne okno.

`edges.spec.mjs` ma jeden zadeklarowany oczekiwany błąd: strona z listenerem klawiatury w fazie capture może przejąć pisanie. Playwright liczy oczekiwany błąd jako zaliczony; nie jest to dowód pełnej izolacji od strony. Kontrola sieci obejmuje tylko obserwowane żądania kontekstu od uruchomienia do końca raportowanego okna obserwacji. Test „Wstecz” wymaga rzeczywistego `pageshow.persisted === true` i włącza bfcache.

## Prywatność i bezpieczeństwo

Odczyt następuje tylko po kliknięciu awatara i dotyczy aktualnego zaznaczenia. Sprawa zawiera wyłącznie zatwierdzony tekst, opcjonalny link, pochodzenie, nazwę hosta strony, czas i znacznik skrócenia. Bez sąsiednich wiadomości, nazw nadawców, tytułu strony lub pełnego URL kanału.

Hasła i inne nietekstowe pola, ramki oraz pola wewnątrz shadow DOM innych komponentów nie są odczytywane. Można wkleić wybrany tekst ręcznie. Link pozostaje tekstem: rozszerzenie nie otwiera go i nie pobiera.

Szkic i bufor wklejania są tylko w pamięci karty. Zamknięcie okna, schowanie rekina i zmiana kanału SPA zachowują szkic. Przeładowanie, opuszczenie dokumentu i powrót „Wstecz” kasują go. Nowe zaznaczenie zastępuje szkic dopiero po kliknięciu „Wstaw nowe zaznaczenie”. Nic nie zapisuje się w pamięci przeglądarki ani na dysku. W fazie 1 nie ma wysyłki sieciowej.

Uprawnienia: `activeTab` i `scripting`, do przywracania po kliknięciu ikony. Nie ma uprawnienia storage. Otwarty shadow root może być czytany przez stronę; zatrzymywanie zdarzeń chroni jedynie przed listenerami klawiatury w fazie bubble. To zaakceptowane ograniczenia MVP z fikcyjnymi danymi, z wariantem panelu iframe w razie problemu na Discordzie.

## Lista kontrolna przed demo (Google Chrome, Discord w przeglądarce, fikcyjne konto i dane)

1. Zbuduj rozszerzenie i załaduj `widget/dist` w Google Chrome.
2. Na zwykłej stronie (np. pl.wikipedia.org) sprawdź ostrość rekina, nieuciętą płetwę i kolory palety.
3. Na Discordzie sprawdź, że rekin nie zasłania kompozytora. Przeciągnij, schowaj, przywróć ikoną; po przeładowaniu wraca.
4. Zaznacz fikcyjną wiadomość „darmowe Nitro, kliknij link”. Kliknij rekina: tylko zaznaczony tekst, „Ze strony: discord.com” i informacja dla opiekuna. Usuń imię i dopisz kilka znaków. Kompozytor Discorda pozostaje pusty i skróty Discorda nie działają. Zatwierdź: „Gotowe!”, bez twierdzenia o wysłaniu do opiekuna.
5. Wpisz fikcyjne zdanie w kompozytorze Discorda bez wysyłania. Zaznacz fragment i kliknij rekina. Podgląd pokazuje dokładnie fragment; kompozytor zachowuje tekst.
6. Utwórz szkic i zmień kanał Discorda: szkic zostaje. Odśwież stronę, usuń zaznaczenie i kliknij rekina: menu, bez starego szkicu.
7. Wyłącz rozszerzenie, otwórz nową kartę ze zwykłą stroną, włącz rozszerzenie i kliknij jego ikonę na tej karcie. Rekin pojawia się i działa.
8. Przeładuj rozszerzenie na `chrome://extensions` bez odświeżania karty z rekinem. Kliknij ikonę na tej karcie. Pozostaje jeden rekin, a zaznacz → rekin → zatwierdź kończy się „Gotowe!”.
9. Przeczytaj wszystkie teksty: po polsku, przyjazne dla dzieci 9–13 lat, bez straszenia i zawstydzania; trzy kroki i zdanie o prywatności.

## Ręczny retest G-01-2

Po załadowaniu nowego buildu w Google Chrome przeładuj rozszerzenie i odśwież kartę Discorda z fikcyjnymi danymi.

1. Przeciągnij rekina, kliknij go bez zaznaczenia i wybierz „Sprawdź wiadomość”. Rekin i jego × znikają; wpisz fikcyjną wiadomość i przejdź przez „Dalej”. Formularz pozostaje widoczny i edytowalny, także po zmianie rozmiaru okna. Tab nie powinien trafiać do ukrytych przycisków rekina.
2. Zamknij formularz przez „Zamknij okno” (×). Rekin wraca w zachowanym miejscu; kliknij go ponownie i sprawdź zachowany tekst. Zamknij także przez Escape i sprawdź ten sam powrót.
3. Zaznacz fikcyjny tekst na stronie i otwórz podgląd. Rekin znika; po zatwierdzeniu i „Gotowe!” wraca. Menu i „Jak to działa” nadal pokazują rekina. Po zamknięciu okna sprawdź ręczne schowanie i przywrócenie ikoną rozszerzenia.

Wynik retestu zgłoś przez `$gsd-verify-work 1 --ws widget`; testy automatyczne nie zastępują tej oceny wizualnej.

## Jeśli Discord przechwytuje pisanie

Zgłoś problem z krokiem 4. Wariant przewidziany w researchu to panel w iframe strony rozszerzenia: własny dokument odcina klawiaturę od dokumentu Discorda. To zmiana architektury wymagająca osobnego wykonania i sprawdzenia CSP. Obecne testy nie udają tej izolacji. Jeśli kroki 7 lub 8 zawodzą, zgłoś błąd przywracania z paska.
