# BezpiecznaAura – rozszerzenie Scamerinio (faza 2)

Scamerinio prowadzi dziecko przez sprawdzanie wybranej wiadomości. Zaznacz tekst i kliknij rekina albo wybierz „Sprawdź wiadomość” i wklej tekst oraz opcjonalny link. Podgląd pozwala usunąć dane, zmienić tekst i świadomie zatwierdzić. Następnie pojawia się wskazówka bezpieczeństwa, trzy pytania i wynik: sygnały, brakujące informacje oraz jeden wyjaśniony krok.

Rekin pozostaje widoczny, a otwarte okno przesuwa się razem z nim. Przeciąganie zachowuje tekst i fokus. Podpowiedzi oznaczone „Podpowiedź z wiadomości” nie zaznaczają odpowiedzi; dziecko wybiera je samodzielnie i klika „Dalej”. „Nie wiem” jest pełnoprawną odpowiedzią. „Wróć” i „Popraw odpowiedzi” zachowują wybory, a zmiany przeliczają wynik.

**Zatwierdzenie w fazie 2 jest lokalne: nie wysłało niczego do rzeczywistego opiekuna.** Sprawa trafia do pamięci service workera, a reguły i odpowiedzi działają w pamięci karty. Po ukończeniu pytań osobny przycisk na wyniku „Poproś opiekuna o sprawdzenie” uruchamia lokalny mock na potrzeby prezentacji. Dopiero udany zapis zatwierdzonej sprawy i aktualnego wyniku pokazuje „Przekazano opiekunowi — demo”. Samo zatwierdzenie, wyświetlenie wyniku lub poprawienie odpowiedzi nie uruchamia prośby. Nie ma rzeczywistego doręczenia, API opiekuna, AI ani oceny reputacji linku.

Przeniesiona decyzja dla fazy 3: po zatwierdzeniu sprawa ma być od razu przekazywana opiekunowi, a wynik dopisywany później. Starszy `.planning/shared/CONTRACT.md` i HND-02 nie odzwierciedlają jeszcze tego modelu i wymagają uzgodnienia przez właściciela kontraktu. Rzeczywiste API i odpowiedź opiekuna pozostają w fazie 3. Faza 2 udostępnia wyłącznie lokalny mock demo po jawnym kliknięciu na wyniku; nie zmienia wspólnych materiałów. Decyzja UAT P7 zachowuje teksty `guardianNotice` i `howToPrivacy` („…zobaczy Twój opiekun”) jako zapowiedź docelowej widoczności. Potwierdzenie demo wyraźnie wyjaśnia, że nie oznacza rzeczywistego doręczenia.

## Lokalne przekazanie opiekunowi — demo

1. Zatwierdź fikcyjną wiadomość, przejdź wskazówkę bezpieczeństwa i trzy pytania. Na wyniku pozostają trzy sekcje, jeden zalecany krok i początkowy fokus na „Popraw odpowiedzi”.
2. Jeśli poprawisz odpowiedzi, ukończ pytania ponownie. Prośba przekazuje przeliczony wynik, nie wcześniejszą wersję. Kliknij „Poproś opiekuna o sprawdzenie” poza sekcjami wyniku. Z klawiatury przejdź do tego przycisku przez Tab i użyj Enter lub Spacji.
3. Po lokalnym zapisie zobaczysz „Przekazano opiekunowi — demo” oraz wyjaśnienie, że sprawa i wynik są tylko w pamięci rozszerzenia, a prawdziwa wysyłka do opiekuna pojawi się w kolejnej wersji. Fokus trafia na „Zamknij”; obok są „Wróć do menu” (kończy to sprawdzanie) i „Edytuj wiadomość”. Podczas oczekiwania nie można ponownie poprosić, zmieniać odpowiedzi ani edytować treści; zamknięcie okna i schowanie rekina nadal działają. Błąd zapisu zachowuje wynik i pozwala ponowić prośbę.
4. Wybierz „Zamknij” i kliknij rekina bez nowego zaznaczenia: wraca potwierdzenie demo bez ponownego przekazania. Jeśli zaznaczysz inną wiadomość, kliknięcie rekina otwiera podgląd nowej treści, a jej zatwierdzenie zaczyna nowe sprawdzanie. Zamknięcie podczas oczekiwania nie otwiera okna po odpowiedzi; późniejsze wznowienie pokazuje potwierdzenie po sukcesie lub zachowany wynik po błędzie.
5. Przeładuj kartę, usuń zaznaczenie i kliknij rekina: menu jest puste, bez poprzedniej sesji. Przeładowanie karty usuwa stan UI, lecz nie musi usuwać rekordów mocka service workera. Restart service workera usuwa jego pamięć.

Mock przyjmuje wiadomość `aura/guardian-request` ze sprawą i kluczami aktualnego wyniku, po sprawdzeniu nadawcy i danych. Rekordy można zobaczyć w konsoli service workera jako `self.__aura.guardianRequests` (maksymalnie 100). Chrome usypia nieaktywny service worker po ok. 30 s, co czyści te kolekcje — pokazuj rekord od razu po kliknięciu prośby (otwarte DevTools service workera utrzymują go przy życiu). Zatwierdzenie zachowuje osobną kolekcję `self.__aura.cases`; prośba nie dodaje do niej drugiej sprawy. Te kolekcje są ulotne, bez sieci i trwałego zapisu. Pokazuj je wyłącznie na fikcyjnych treściach; nie są skrzynką ani odpowiedzią prawdziwego opiekuna.

## Roboczy pakiet treści i ograniczenia

Pakiet do przeglądu przez **osobę 4** znajduje się w `src/ui/strings.pl.js` (polskie pytania, odpowiedzi, wyjaśnienia i instrukcje) oraz `src/core/check.js` (jawne reguły `detectHints` i `evaluate`). Przykłady i kontrakty sprawdzają `tests/unit/check.test.js`, `tests/unit/panel.test.js` i `tests/e2e/check.spec.mjs`. Nieistniejący jeszcze wspólny pakiet `shared/content/` nie blokuje tego demo; późniejsze dopasowanie wymaga zachowania ustalonych zachowań.

- Prośby „podaj / wyślij / prześlij hasło” lub kod do konta, logowania czy SMS tworzą ostrzeżenie. Samo słowo „kod”, kod pocztowy lub źródłowy go nie tworzy. Odpowiedź dziecka wskazująca hasło lub kod także zachowuje ostrzeżenie.
- Nagroda wymaga zaproszenia do jej odebrania oraz linku w tekście lub osobnym polu. Zwykła wzmianka o nagrodzie i neutralny link nie tworzą alarmu. Sam link nie potwierdza wiarygodności nadawcy.
- Zapłata wymaga presji, np. „natychmiast”, „ostatnia szansa” albo groźby straty. Przypomnienie o obiedzie bez presji nie alarmuje. Samodzielna odpowiedź o zapłacie proponuje ostrożne sprawdzenie.
- „Dziś” samo w sobie nie oznacza pośpiechu. Rozpoznajemy wąskie frazy związane z działaniem, nie każdą datę ani każdy synonim.
- Ostrzeżenia „nie podawaj…” oraz wyraźnie zgłaszane prośby, np. `Oszust napisał: „podaj kod do konta”` i `Zgłaszam wiadomość: podaj hasło do konta`, nie są automatycznym alarmem o zgłaszającym. Osobna bezpośrednia prośba po cytacie nadal pozostaje sygnałem. Nie jest to pełna analiza znaczenia wszystkich możliwych cytatów.
- Kopia do dopasowania usuwa różnice wielkości liter, akcentów, NFC/NFD i spacji NBSP; zatwierdzona treść pozostaje bez zmian. Limity tekstu i linku liczone są punktami kodowymi, również dla emoji.
- Priorytet jednego kroku: ochrona hasła/kodu → zapłata z presją → nagroda z linkiem → zatrzymanie pośpiechu → niezależne sprawdzenie. Znany kanał trzeba otworzyć samodzielnie, poza linkiem z wiadomości.

Wynik nie gwarantuje bezpieczeństwa ani tożsamości nadawcy. Brak informacji nie jest dowodem oszustwa. Nie ma punktów, prawdopodobieństwa ani automatycznego sprawdzania linków; reguły mogą nie rozpoznać innych sformułowań. Demo używa wyłącznie fikcyjnych treści, haseł, kodów i profili.

## Pięć fikcyjnych wiadomości demo

Po zatwierdzeniu każdej wiadomości przejdź przez wskazówkę bezpieczeństwa i trzy pytania. Każdy scenariusz zaczynaj po odświeżeniu karty, aby mieć puste odpowiedzi.

| Wiadomość | Wybory do pokazania | Oczekiwany wynik |
|---|---|---|
| „Podaj kod do konta, aby odebrać nagrodę” | Nie znam nadawcy → Podania kodu do konta → Nie mam innego sposobu | Konkretny sygnał o kodzie, brak nadawcy i kanału, jeden krok: nie podawaj hasła/kodu i poproś dorosłego lub sprawdź przez znaną pomoc. Wariant hasła: „Prześlij hasło do konta”. |
| „Odbierz darmową nagrodę: https://nagroda.example/prezent” | Ktoś podaje się za firmę lub organizację → Odebrania darmowej nagrody → Tylko przez link z tej wiadomości | Wyjaśnienie nagrody z linkiem, brak niezależnego kanału, jeden krok: sprawdź nagrodę poza wiadomością. Nie otwieraj linku demo. |
| „Zapłać natychmiast, inaczej stracisz konto.” | Nie znam nadawcy → Zapłaty lub przelewu **i** Szybkiego działania → Nie mam innego sposobu | Sygnały zapłaty z presją i pośpiechu, brak nadawcy i kanału, jeden krok: sprawdź prośbę przez wcześniej znany kontakt przed zapłatą. |
| „Dziś gramy o 17, spotkajmy się w naszej grupie” | Osoba, którą znam → Zwykła wiadomość, bez takich próśb → Przez znaną mi aplikację, stronę lub kontakt | „Nie widzę typowych sygnałów oszustwa. To nie daje pewności — sprawdź wiadomość oficjalnym kanałem.” Brak dodatkowych wskazanych niewiadomych nie potwierdza bezpieczeństwa. |
| „Zobacz to” | Nie wiem → Nie wiem → Nie wiem | Brak automatycznego alarmu; brak nadawcy, oczekiwań, informacji o pośpiechu i niezależnym kanale. Jeden krok: sprawdź przez znany kanał. |

W wariancie z kodem wybierz najpierw „Zwykła wiadomość, bez takich próśb” i kliknij „Dalej”. Komunikat rozbieżności oferuje „Popraw odpowiedź” lub „Zostaw moją odpowiedź”. Zachowanie wyboru pozostawia ostrzeżenie i wyjaśnia niepewność; poprawienie na kod usuwa rozbieżność. Zmiana odpowiedzi po jej zachowaniu wymaga nowego potwierdzenia. Sprawdź także uczciwe przykłady „Nie podawaj hasła ani kodu”, „Zapłać za obiad, gdy będziesz mieć czas” i „Wygrałem nagrodę na szkolnym konkursie”: przy zwykłej odpowiedzi i znanym kanale nie powinny mieć automatycznych sygnałów.

## Budowanie

W katalogu `projects/widget/`:

```sh
npm ci
npm run build
```

Wynik: `projects/widget/dist/`. Zależności są przypięte w lockfile; wykonanie tej fazy nie dodaje ani nie aktualizuje pakietów.

## Uruchomienie w Google Chrome

1. Otwórz `chrome://extensions` i włącz **Tryb dewelopera**.
2. Kliknij **Załaduj rozpakowane** i wskaż `projects/widget/dist`.
3. Otwórz zwykłą stronę HTTP(S). Rekin pojawi się w prawym dolnym rogu. Możesz go przeciągnąć lub schować przyciskiem ×; ikona rozszerzenia przywraca go na tej karcie.
4. Po każdym przebudowaniu kliknij przeładowanie na karcie rozszerzenia i odśwież kartę demo. Jeśli karta nie została odświeżona, kliknięcie ikony na pasku zastępuje osieroconego rekina działającą instancją.

Chrome ogranicza działanie rozszerzeń m.in. na stronach `chrome://`, Chrome Web Store i w swoim podglądzie PDF. Demo dotyczy Google Chrome i Discorda w przeglądarce, nie aplikacji Discord na komputerze lub telefonie.

## Testy

```sh
npm test
npm run test:e2e
npm run test:e2e -- tests/e2e/check.spec.mjs
```

Vitest używa happy-dom z przetwarzaniem rzeczywistego CSS. Testy D-04 pilnują miejsc odczytu i wysyłki, listenerów, uprawnień i zakazu zapisu treści. Playwright uruchamia rozszerzenie w lokalnym `/usr/bin/chromium`, jeśli jest dostępne.

- `AURA_CHROMIUM=bundled npm run test:e2e` wybiera Chromium Playwrighta (po `npx playwright install chromium`).
- `AURA_CHROMIUM=/ścieżka/do/chromium npm run test:e2e` wybiera konkretny plik wykonywalny.
- `AURA_HEADED=1 npm run test:e2e` otwiera widoczne okno.

`edges.spec.mjs` ma jeden zadeklarowany oczekiwany błąd: strona z listenerem klawiatury w fazie capture może przejąć pisanie. Playwright liczy oczekiwany błąd jako zaliczony; nie jest to dowód pełnej izolacji od strony. Kontrola sieci obejmuje tylko obserwowane żądania kontekstu od uruchomienia do końca raportowanego okna obserwacji. Test „Wstecz” wymaga rzeczywistego `pageshow.persisted === true` i włącza bfcache.

## Prywatność i bezpieczeństwo

Odczyt następuje tylko po kliknięciu awatara i dotyczy aktualnego zaznaczenia. Sprawa zawiera wyłącznie zatwierdzony tekst, opcjonalny link, pochodzenie, nazwę hosta strony, czas i znacznik skrócenia. Bez sąsiednich wiadomości, nazw nadawców, tytułu strony lub pełnego URL kanału.

Hasła i inne nietekstowe pola, ramki oraz pola wewnątrz shadow DOM innych komponentów nie są odczytywane. Można wkleić wybrany tekst ręcznie. Link pozostaje tekstem: rozszerzenie nie otwiera go i nie pobiera.

Szkic, bufor wklejania, odpowiedzi i wynik są tylko w pamięci karty. Zamknięcie okna, schowanie rekina, zmiana karty i zmiana kanału SPA zachowują szkic oraz trwające sprawdzanie. Po kliknięciu rekina wraca ten sam ekran: wskazówka bezpieczeństwa, jedno z trzech pytań, wynik albo potwierdzenie demo. Przeładowanie, opuszczenie dokumentu i powrót „Wstecz”, również z bfcache, kasują stan karty i unieważniają spóźnione odpowiedzi. Nie oznacza to usunięcia ulotnych rekordów osobnego service workera. Nowe zaznaczenie zastępuje niezatwierdzony szkic dopiero po kliknięciu „Wstaw nowe zaznaczenie”. W trakcie sprawdzania przycisk „Sprawdź nowe zaznaczenie” otwiera osobny podgląd; stara sprawa i odpowiedzi zostają aż do udanego zatwierdzenia nowej treści.

„Edytuj wiadomość” otwiera kopię zatwierdzonego tekstu i linku. „Wróć do sprawdzania” anuluje edycję lub podgląd nowego zaznaczenia i wraca do poprzedniego pytania albo wyniku. Sama edycja, podgląd i anulowanie nie tworzą sprawy. Udane ponowne zatwierdzenie zmienionego tekstu **lub samego linku** rozpoczyna wskazówkę bezpieczeństwa i trzy puste pytania. Niezmieniona treść po normalizacji zachowuje postęp. Błąd zatwierdzenia zachowuje edytowaną kopię i starą sesję; przeładowanie zalecane przez komunikat usuwa je obie. Treści nie zapisują się w trwałej pamięci przeglądarki ani na dysku. W fazie 2 nie ma wysyłki sieciowej.

Uprawnienia: `activeTab` i `scripting`, do przywracania po kliknięciu ikony. Nie ma uprawnienia storage. Otwarty shadow root może być czytany przez stronę; zatrzymywanie zdarzeń chroni jedynie przed listenerami klawiatury w fazie bubble. To zaakceptowane ograniczenia MVP z fikcyjnymi danymi, z wariantem panelu iframe w razie problemu na Discordzie.

## Lista kontrolna przed demo (Google Chrome, Discord w przeglądarce, fikcyjne konto i dane)

1. Zbuduj rozszerzenie i załaduj `projects/widget/dist` w Google Chrome.
2. Na zwykłej stronie (np. pl.wikipedia.org) sprawdź ostrość rekina, nieuciętą płetwę i kolory palety.
3. Na Discordzie sprawdź, że rekin nie zasłania kompozytora. Przeciągnij, schowaj, przywróć ikoną; po przeładowaniu wraca.
4. Zaznacz jedną z pięciu fikcyjnych wiadomości powyżej. Kliknij rekina: tylko zaznaczony tekst, „Ze strony: discord.com” i informacja o docelowym modelu opiekuna. Usuń imię i dopisz kilka znaków. Kompozytor Discorda pozostaje pusty; sprawdź izolację pisania zgodnie z ograniczeniem capture poniżej. Zatwierdź: wskazówka „Zanim sprawdzimy…”, następnie trzy pytania i wynik. Lokalne zatwierdzenie nie oznacza wysłania do opiekuna.
5. Wpisz fikcyjne zdanie w kompozytorze Discorda bez wysyłania. Zaznacz fragment i kliknij rekina. Podgląd pokazuje dokładnie fragment; kompozytor zachowuje tekst.
6. Utwórz szkic i zmień kanał Discorda: szkic zostaje. Odśwież stronę, usuń zaznaczenie i kliknij rekina: menu, bez starego szkicu.
7. Wyłącz rozszerzenie, otwórz nową kartę ze zwykłą stroną, włącz rozszerzenie i kliknij jego ikonę na tej karcie. Rekin pojawia się i działa.
8. Przeładuj rozszerzenie na `chrome://extensions` bez odświeżania karty z rekinem. Kliknij ikonę na tej karcie. Pozostaje jeden rekin, a zaznacz → rekin → zatwierdź pokazuje wskazówkę bezpieczeństwa.
9. Przejdź wszystkie pięć scenariuszy i oba warianty rozbieżności. Sprawdź niezaznaczone podpowiedzi, „Nie wiem”, „Wróć”, „Popraw odpowiedzi”, trzy nazwane sekcje i dokładnie jeden krok z instrukcją. Nie powinno być surowych kluczy ani zapewnienia, że wiadomość jest bezpieczna.
10. Osoba 4 przegląda polskie teksty dla dzieci 10–13 lat: czytelne ograniczenia, konkretne działania, brak straszenia i zawstydzania. Testy automatyczne nie zastępują tej oceny w Google Chrome.

## Retest ścieżki sprawdzania w Google Chrome

Używaj pięciu fikcyjnych scenariuszy z tabeli powyżej. Zatwierdzenie nadal oznacza wyłącznie lokalne przyjęcie. Osobny przycisk na wyniku uruchamia opisane wyżej demo przekazania; oznaczone potwierdzenie dotyczy lokalnego mocka, bez wiadomości lub odpowiedzi od rzeczywistego opiekuna.

1. Na wskazówce bezpieczeństwa, Q1, Q2, Q3 i wyniku zamknij okno przez ×, a następnie przez Escape i otwórz rekinem. Powinien wrócić ten sam ekran i wybrane odpowiedzi. Powtórz ze schowaniem rekina i przywróceniem ikoną rozszerzenia.
2. Na Q2 wybierz dwie odpowiedzi i zmień kartę przeglądarki. Okno zostaje na pierwszej karcie; po powrocie oba wybory zostają. Zmiana kanału Discorda bez przeładowania również zachowuje postęp.
3. Na wyniku kliknij „Popraw odpowiedzi”. Q1 zachowuje wybór. Zmień Q2, przejdź przez zachowaną Q3 i sprawdź przeliczone sygnały, brakujące informacje i krok. „Wróć” zachowuje pozostałe odpowiedzi. W scenariuszu z kodem sprawdź ponownie oba warianty rozbieżności.
4. Kliknij „Edytuj wiadomość”, zmień tekst i link, a potem „Wróć do sprawdzania”: stary wynik wraca bez zmian. Otwórz edycję ponownie: pola zawierają poprzednią zatwierdzoną treść. Zatwierdź zmieniony tekst: wskazówka i trzy pytania bez dawnych wyborów. Powtórz osobno, zmieniając **tylko link**; stare odpowiedzi i wynik też znikają. Zatwierdzenie niezmienionej kopii zachowuje postęp.
5. Podczas Q2 lub na wyniku zaznacz inną fikcyjną wiadomość na stronie i kliknij rekina. Najpierw wraca sprawdzanie z przyciskiem dokładnie „Sprawdź nowe zaznaczenie”. Otwórz podgląd i anuluj: poprzednie wybory lub wynik zostają. Zaznacz ponownie, otwórz podgląd i zatwierdź: dopiero teraz rozpoczynają się puste pytania dla nowej treści. Bez nowego zaznaczenia przycisku nie ma.
6. Z Q2, z wyniku i z niedokończonej edycji przeładuj kartę lub przejdź na inny dokument i wróć „Wstecz”. Usuń zaznaczenie i kliknij rekina: powinno być menu, bez poprzednich odpowiedzi, wyniku i kopii edycji. Zmiana karty z kroku 2 nadal je zachowuje.
7. Na Q2 ustaw fokus na wybranej odpowiedzi; na wyniku na „Popraw odpowiedzi”. Przeciągnij rekina: okno porusza się już przed puszczeniem, rekin i × zostają widoczne, fokus i wybory nie zmieniają się. Nowe zaznaczenie na stronie nie staje się podglądem podczas przeciągania. Sprawdź krawędzie i wąskie okno: odpowiedzi oraz przyciski pozostają osiągalne przez przewijanie panelu.

Testy przeglądarkowe wymagają prawdziwego `pageshow.persisted === true` przy bfcache i sprawdzają tożsamość kontrolek oraz fokus podczas przeciągania. Zmiana rozmiaru okna może odtworzyć kontrolki; gwarancja zachowania ich tożsamości dotyczy samego przeciągania. Ręcznie oceń czytelność długich tekstów, małych podpowiedzi, obrysów fokusu i przycisku schowania. Ton, wygląd i zrozumiałość informacji o przyszłym opiekunie pozostają częścią UAT, nie wynikiem samych testów.

## Ręczny retest G-01-2-drag

Po załadowaniu nowego buildu w Google Chrome przeładuj rozszerzenie i odśwież kartę Discorda z fikcyjnymi danymi. Aktualne kryterium zastępuje wcześniejsze chowanie rekina: rekin pozostaje widoczny, a otwarte okno podąża za nim.

1. Kliknij rekina bez zaznaczenia. Przeciągnij go z otwartym menu, a następnie z otwartym „Jak to działa”. Okno przesuwa się razem z nim już podczas przeciągania; puszczenie nie zmienia widoku.
2. Otwórz „Sprawdź wiadomość”, wpisz fikcyjny tekst i link. Przeciągnij rekina: formularz podąża za nim, tekst i link zostają, aktywne pole oraz zaznaczenie w polu nie zmieniają się. Przejdź przez „Dalej” i powtórz w podglądzie. Rekin i jego × pozostają widoczne.
3. Przeciągnij rekina do krawędzi ekranu i zmień rozmiar okna Chrome. Panel pozostaje na ekranie, a rekin dostępny do kolejnego przeciągnięcia. Przy krawędziach panel może zmienić stronę względem rekina, aby zmieścić się w oknie.
4. Zamknij formularz przez „Zamknij okno” (×), otwórz go ponownie i sprawdź szkic. Powtórz przez Escape. Przeciąganie nie wysyła wiadomości, nie zastępuje szkicu zaznaczeniem z Discorda ani nie uruchamia jego skrótów.
5. Zaznacz fikcyjny tekst na stronie, otwórz podgląd i przeciągnij rekina. Dopiero świadome „Zatwierdzam” pokazuje wskazówkę bezpieczeństwa. Także to okno podąża za rekinem. Sprawdź ręczne schowanie i przywrócenie ikoną rozszerzenia.

Wynik retestu zgłoś przez `$gsd-verify-work 1 --ws widget`; testy automatyczne nie zastępują tej oceny wizualnej.

## Jeśli Discord przechwytuje pisanie

Zgłoś problem z krokiem 4. Wariant przewidziany w researchu to panel w iframe strony rozszerzenia: własny dokument odcina klawiaturę od dokumentu Discorda. To zmiana architektury wymagająca osobnego wykonania i sprawdzenia CSP. Obecne testy nie udają tej izolacji. Jeśli kroki 7 lub 8 zawodzą, zgłoś błąd przywracania z paska.
