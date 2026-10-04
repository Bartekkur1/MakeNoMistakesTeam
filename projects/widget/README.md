# BezpiecznaAura – rozszerzenie Scamerinio (faza 3)

Scamerinio prowadzi dziecko przez sprawdzanie wybranej wiadomości. Zaznacz tekst i kliknij rekina albo wybierz „Sprawdź wiadomość” i wklej tekst oraz opcjonalny link. Podgląd pozwala usunąć dane, zmienić tekst i świadomie zatwierdzić. Następnie pojawia się wskazówka bezpieczeństwa, trzy pytania i wynik: sygnały, brakujące informacje oraz jeden wyjaśniony krok.

Rekin pozostaje widoczny, a otwarte okno przesuwa się razem z nim. Przeciąganie zachowuje tekst i fokus. Podpowiedzi oznaczone „Podpowiedź z wiadomości” nie zaznaczają odpowiedzi; dziecko wybiera je samodzielnie i klika „Dalej”. „Nie wiem” jest pełnoprawną odpowiedzią. „Wróć” i „Popraw odpowiedzi” zachowują wybory, a zmiany przeliczają wynik.

**Zatwierdzenie jest lokalne i niczego nie wysyła (D-01).** „Zatwierdzam” przyjmuje tekst do sprawdzania w pamięci karty; reguły, pytania i wynik działają lokalnie. Wynik zostaje u dziecka. Na wyniku są dwa niezależne przyciski: **„Pokaż opiekunowi”** (podgląd zgłoszenia dla rodzica) i **„Jak zgłosić na platformie”** (stała instrukcja, która nic nie wysyła). Jedynym przyciskiem, który wysyła cokolwiek do serwera, jest **„Wyślij”** w podglądzie „Sprawdź, co wyślesz”. Odpowiedzią dla dziecka jest **status zgłoszenia** w „Moje zgłoszenia” (decyzja rodzica, D-16) — nie ma odpowiedzi tekstowej, historii, szczegółów ani komentarzy.

## Połączenie z kontem rodzica (D-08…D-12)

1. Po instalacji rozszerzenie samo otwiera kartę logowania (to samo co „Opcje” rozszerzenia). Loguje się **rodzic**, nie dziecko: krok 1 — e-mail (nic nie wysyła), krok 2 — czterocyfrowy kod. Konto nauczyciela dostaje komunikat, że wtyczkę łączy rodzic (403).
2. „Zobacz konta demo” pokazuje trzy fikcyjne konta rodziców. Do prezentacji używaj **Mama Oli (demo)** — `rodzic.ola@bezpiecznaaura.example`, kod `0000`. Kod demo jest wspólny i jawny (AR-01 web-app): logowanie demo nie jest zabezpieczeniem produkcyjnym. Nie podawaj tego kodu dziecku ani nie przedstawiaj go jako jego hasła.
3. Po zalogowaniu karta pokazuje „Wtyczka połączona”. „Wyloguj” działa bez PIN-u i potwierdzenia. Bez konta sprawdzanie działa w pełni, a zamiast „Pokaż opiekunowi” widać „Wtyczka nie jest połączona z kontem rodzica…” i „Otwórz logowanie” (D-11).
4. Sesja nie wygasa dla dziecka: gdy token wygaśnie albo serwer odpowie 401, service worker sam loguje się ponownie zapisanym e-mailem/kodem i powtarza **jedną** operację (tylko przy jawnym „Wyślij”, „Moje zgłoszenia” lub „Spróbuj ponownie”). Odczyt statusu sesji jest lokalny i nie łączy się z siecią.

Adres API jest wbudowany w paczkę: domyślnie `https://bezpieczna-aura.pl`. Do pracy na lokalnym backendzie zbuduj `AURA_API=http://localhost:3000 npm run build`. Inne adresy są odrzucane przy budowaniu.

## Pokaż opiekunowi → Sprawdź, co wyślesz → Wyślij (HND-01, ERR-01)

1. Na wyniku kliknij „Pokaż opiekunowi”. Podgląd pokazuje odbiorcę („Do: Mama Oli (demo)”), dokładną treść zgłoszenia (tekst i ewentualnie `Link: …`), proponowany rodzaj ataku z oznaczeniem „Propozycja z Twoich odpowiedzi”, pola „Co już zrobiłeś?” i źródło. Wszystko można zmienić; nic nie zostało jeszcze wysłane.
2. „Wyślij” wysyła jedno zgłoszenie z dokładnie czterema polami: rodzaj ataku, podjęte działania, źródło i treść. Wynik sprawdzania i odpowiedzi na pytania nie są wysyłane.
3. „Wysłano do: …”, godzina i „Status: Czeka, aż rodzic zobaczy” pojawiają się tylko po zapisanym obiekcie zgłoszenia z serwera. Tej samej sprawy nie da się wysłać drugi raz.
4. Błędy mają osobne komunikaty i zawsze zostawiają wybory w podglądzie: „Nie wysłano — brak połączenia” (brak sieci, 503), „Nie wysłano” (400/413/500 i inne), „Nie wiemy, czy dotarło” (zerwane połączenie po wysłaniu, limit 15 s, niepoprawna odpowiedź) oraz „Rozszerzenie zostało przeładowane…”. Nie ma automatycznych powtórzeń. Przy „Nie wiemy, czy dotarło” dziecko najpierw otwiera „Moje zgłoszenia”, a dopiero potem może świadomie kliknąć „Wyślij jeszcze raz”.

## Moje zgłoszenia (HND-03, D-14)

Menu rekina ma trzy pozycje: „Sprawdź wiadomość”, „Moje zgłoszenia”, „Jak to działa”. Każde otwarcie listy (i „Spróbuj ponownie”) wysyła jedno `GET /api/reports?limit=10` dla połączonego konta rodzica. Lista pokazuje do 10 najnowszych zgłoszeń w kolejności z serwera, bez „Pokaż więcej”: początek treści (60 znaków), rodzaj ataku z datą i spokojny status:

| Stan | Tekst dla dziecka |
|---|---|
| `pending_parent` | Czeka, aż rodzic zobaczy |
| `with_teacher` | Rodzic poprosił o pomoc nauczyciela |
| `escalated` | Dorośli zgłosili to dalej |
| `closed` | Sprawa zamknięta |
| `rejected` | Rodzic zobaczył — porozmawiajcie o tym |

Wiersze to zwykły tekst — bez szczegółów, historii i komentarzy (token wtyczki nie ma do nich dostępu). Lista istnieje tylko w pamięci otwartego widoku; nic nie trafia na dysk. Pusta lista pokazuje „Nie ma jeszcze zgłoszeń”, błąd — „Nie udało się wczytać zgłoszeń” i „Spróbuj ponownie”, brak konta — komunikat D-11. Obejrzenie listy nigdy nie oznacza sprawy jako wysłanej i niczego nie wysyła ponownie. Wylogowanie lub zmiana konta w opcjach czyści wyświetlone wiersze w otwartych kartach.

## Jak zgłosić na platformie (HND-02, D-15)

Przycisk na wyniku działa także bez konta rodzica. Otwiera krótką instrukcję dla wybranego źródła (Discord, Gra, Mail, SMS, Inne; to samo pole co w podglądzie), z informacją „To zgłoszenie do serwisu, nie do rodzica. Ta instrukcja niczego nie wysyła.” Jedyne linki w rozszerzeniu to stałe adresy: Roblox (dla gry), CERT Polska i Dyżurnet.pl; otwierają się w nowej karcie. Link z wiadomości dziecka zawsze pozostaje tekstem. „Wróć do wyniku” wraca do tego samego wyniku.

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

## Release WidgetUI w GitHub Actions

Workflow `.github/workflows/release-widgetui.yml` publikuje ZIP rozszerzenia w GitHub Releases po wypchnięciu taga `widgetui-vX.Y.Z`. Wersje w `projects/widget/package.json`, `projects/widget/package-lock.json` (pakiet główny) i `projects/widget/manifest.json` powinny odpowiadać tagowi; workflow sprawdza `package.json` i manifest. Zmiany wersji zatwierdź przed utworzeniem taga.

```sh
git tag widgetui-v0.1.0
git push origin widgetui-v0.1.0
```

Workflow musi znajdować się w tagowanym commicie. Można też wybrać **Actions → Release WidgetUI → Run workflow**, podając istniejący tag (ręczne uruchamianie wymaga workflow na domyślnej gałęzi). Budowanie używa Node.js 22, `npm ci` i API `https://bezpieczna-aura.pl`; wystarcza wbudowany `GITHUB_TOKEN`, bez dodatkowych sekretów. Ponowne uruchomienie zastępuje ZIP istniejącego release'u.

Pobierz `bezpiecznaaura-wtyczka.zip` z release'u, rozpakuj do osobnego folderu i załaduj go przez **Załaduj rozpakowane** w `chrome://extensions` w Trybie dewelopera. `manifest.json` znajduje się bezpośrednio w rozpakowanym folderze. ZIP zawiera wyłącznie wynik budowania, bez źródeł i `node_modules`.

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

Szkic, bufor wklejania, odpowiedzi, wynik, podgląd zgłoszenia i lista „Moje zgłoszenia” są tylko w pamięci karty. Zamknięcie okna, schowanie rekina, zmiana karty i zmiana kanału SPA zachowują szkic oraz trwające sprawdzanie lub wysyłkę. Po kliknięciu rekina wraca ten sam ekran: wskazówka bezpieczeństwa, jedno z trzech pytań, wynik, podgląd, instrukcja platformy albo potwierdzenie wysłania. Przeładowanie, opuszczenie dokumentu i powrót „Wstecz”, również z bfcache, kasują stan karty i unieważniają spóźnione odpowiedzi. Service worker trzyma osobno, tylko w pamięci, ostatni wynik wysyłki dla karty, dokumentu i sprawy (maks. 100 wpisów, 5 minut po zakończeniu); Chrome usypia go po ok. 30 s bezczynności i wtedy ta pamięć znika — utracony wynik nigdy nie jest zgadywany ani wysyłany ponownie. Nowe zaznaczenie zastępuje niezatwierdzony szkic dopiero po kliknięciu „Wstaw nowe zaznaczenie”. W trakcie sprawdzania przycisk „Sprawdź nowe zaznaczenie” otwiera osobny podgląd; stara sprawa i odpowiedzi zostają aż do udanego zatwierdzenia nowej treści.

„Edytuj wiadomość” otwiera kopię zatwierdzonego tekstu i linku. „Wróć do sprawdzania” anuluje edycję lub podgląd nowego zaznaczenia i wraca do poprzedniego pytania albo wyniku. Sama edycja, podgląd i anulowanie nie tworzą sprawy. Udane ponowne zatwierdzenie zmienionego tekstu **lub samego linku** rozpoczyna wskazówkę bezpieczeństwa i trzy puste pytania. Niezmieniona treść po normalizacji zachowuje postęp. Błąd zatwierdzenia zachowuje edytowaną kopię i starą sesję; przeładowanie zalecane przez komunikat usuwa je obie. Treści nie zapisują się w trwałej pamięci przeglądarki ani na dysku. Ruch sieciowy wykonuje wyłącznie service worker i tylko po jawnej akcji: logowanie rodzica, „Wyślij” oraz otwarcie lub odświeżenie „Moje zgłoszenia”. Uruchomienie strony, sprawdzanie, przeciąganie, instrukcja platformy i zmiana źródła nie łączą się z siecią.

Uprawnienia: `activeTab` i `scripting` (przywracanie po kliknięciu ikony) oraz `storage`; hosty tylko `https://bezpieczna-aura.pl/*` i `http://localhost:3000/*`. Jedynym zapisem na dysku jest wpis `auraSession` z danymi logowania rodzica (token, `expires_at`, konto, e-mail i kod demo) — wyjątek D-10 od zasady „treść spraw nie trafia na dysk”. `chrome.storage.local` jest dostępny tylko dla zaufanych kontekstów rozszerzenia (service worker, strona logowania), a token nigdy nie trafia do skryptu na stronie, adresu URL ani logów. Otwarty shadow root może być czytany przez stronę; zatrzymywanie zdarzeń chroni jedynie przed listenerami klawiatury w fazie bubble. To zaakceptowane ograniczenia MVP z fikcyjnymi danymi, z wariantem panelu iframe w razie problemu na Discordzie.

## Lista kontrolna przed demo (Google Chrome, Discord w przeglądarce, fikcyjne konto i dane)

1. Zbuduj rozszerzenie i załaduj `projects/widget/dist` w Google Chrome.
2. Na zwykłej stronie (np. pl.wikipedia.org) sprawdź ostrość rekina, nieuciętą płetwę i kolory palety.
3. Na Discordzie sprawdź, że rekin nie zasłania kompozytora. Przeciągnij, schowaj, przywróć ikoną; po przeładowaniu wraca.
4. Zaznacz jedną z pięciu fikcyjnych wiadomości powyżej. Kliknij rekina: tylko zaznaczony tekst, „Ze strony: discord.com” i informacja, że nic nie zostanie wysłane bez „Pokaż opiekunowi” i „Wyślij”. Usuń imię i dopisz kilka znaków. Kompozytor Discorda pozostaje pusty; sprawdź izolację pisania zgodnie z ograniczeniem capture poniżej. Zatwierdź: wskazówka „Zanim sprawdzimy…”, następnie trzy pytania i wynik. Lokalne zatwierdzenie nie oznacza wysłania do opiekuna.
5. Wpisz fikcyjne zdanie w kompozytorze Discorda bez wysyłania. Zaznacz fragment i kliknij rekina. Podgląd pokazuje dokładnie fragment; kompozytor zachowuje tekst.
6. Utwórz szkic i zmień kanał Discorda: szkic zostaje. Odśwież stronę, usuń zaznaczenie i kliknij rekina: menu, bez starego szkicu.
7. Wyłącz rozszerzenie, otwórz nową kartę ze zwykłą stroną, włącz rozszerzenie i kliknij jego ikonę na tej karcie. Rekin pojawia się i działa.
8. Przeładuj rozszerzenie na `chrome://extensions` bez odświeżania karty z rekinem. Kliknij ikonę na tej karcie. Pozostaje jeden rekin, a zaznacz → rekin → zatwierdź pokazuje wskazówkę bezpieczeństwa.
9. Przejdź wszystkie pięć scenariuszy i oba warianty rozbieżności. Sprawdź niezaznaczone podpowiedzi, „Nie wiem”, „Wróć”, „Popraw odpowiedzi”, trzy nazwane sekcje i dokładnie jeden krok z instrukcją. Nie powinno być surowych kluczy ani zapewnienia, że wiadomość jest bezpieczna.
10. Osoba 4 przegląda polskie teksty dla dzieci 10–13 lat: czytelne ograniczenia, konkretne działania, brak straszenia i zawstydzania. Testy automatyczne nie zastępują tej oceny w Google Chrome.

## Retest ścieżki sprawdzania w Google Chrome

Używaj pięciu fikcyjnych scenariuszy z tabeli powyżej. Zatwierdzenie nadal oznacza wyłącznie lokalne przyjęcie; wysyłka do rodzica następuje dopiero po „Pokaż opiekunowi” → „Wyślij”.

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

## Lista kontrolna fazy 3 w Google Chrome (fikcyjne dane, konto Mama Oli)

Wysyłki testowe rób na lokalnym backendzie (`AURA_API=http://localhost:3000`) albo kontami smoke; na prezentacji używaj Mamy Oli. Ruch obserwuj w DevTools service workera (chrome://extensions → „service worker”).

1. **Dokładne pola.** Zaloguj Mamę Oli, sprawdź wiadomość „Gratulacje! Wygrałeś skina, odbierz nagrodę: https://nagroda-demo.example/odbierz”. Do wyniku nie ma żadnego żądania. „Pokaż opiekunowi” → podgląd: „Do: Mama Oli (demo)”, treść kończy się `Link: …`, propozycja „Fałszywa nagroda lub konkurs”. Zmień rodzaj ataku, działania i źródło; niedozwolone działania znikają. „Wyślij” → jedno `POST /api/reports` z czterema polami równymi podglądowi.
2. **Instrukcja platformy.** Na wyniku (także wylogowany) „Jak zgłosić na platformie”: przejrzyj Discord, Gra, Mail, SMS, Inne. Żadnego żądania sieciowego. Źródło wybrane tu jest tym samym w podglądzie wysyłki. Zamknij i otwórz okno — wraca instrukcja; „Wróć do wyniku” wraca do wyniku.
3. **Moje zgłoszenia.** Menu → „Moje zgłoszenia” → jedno `GET /api/reports?limit=10`; „Wróć” i ponowne otwarcie robią nowe żądanie. Zmień stan zgłoszenia w panelu rodzica (zatwierdź, odrzuć, przekaż nauczycielowi, zamknij) i otwórz listę ponownie: widać dokładny status, także „Rodzic zobaczył — porozmawiajcie o tym”. Sprawdź 0, 1 i 10 wierszy (kontrolowane odpowiedzi lub konta demo): separatory, brak „Pokaż więcej”, kolejność z serwera, dwa zgłoszenia z tą samą datą pozostają osobnymi wierszami.
4. **Awarie listy.** Offline lub zatrzymany backend: „Nie udało się wczytać zgłoszeń” i „Spróbuj ponownie”; bez konta: „Otwórz logowanie”.
5. **Awarie wysyłki.** Kolejno: offline przed wysłaniem i 503 → „Nie wysłano — brak połączenia”; 400/413/500 → „Nie wysłano”; opóźnienie powyżej 15 s, 204 lub uszkodzona odpowiedź → „Nie wiemy, czy dotarło”. Wybory zostają, nic nie ponawia się samo.
6. **Niepewna wysyłka.** Przy „Nie wiemy, czy dotarło” kliknij „Moje zgłoszenia”, sprawdź listę, „Wróć” — podgląd z tymi samymi wyborami i ostrzeżeniem. „Wyślij jeszcze raz” wysyła dopiero po kliknięciu.
7. **Konto.** Bez logowania: komunikat D-11. Wyloguj w opcjach przy otwartym podglądzie lub liście: wiersze znikają, pojawia się „Otwórz logowanie”. Zaloguj inne konto demo między otwarciem podglądu a „Wyślij”: wysyłka nie idzie do nieobejrzanego rodzica, „Do:” pokazuje nowe konto. Zepsuty token z przyszłą datą: jedno 401 → ciche logowanie → jedno powtórzenie.
8. **Duplikaty i zamknięcie.** Dwuklik „Wyślij” daje jedno `POST`. Zamknij okno lub schowaj rekina w trakcie wysyłki: po ponownym otwarciu widać „Wysyłam…” albo wynik, bez drugiego `POST`. Po potwierdzeniu ta sama sprawa nie wyśle się drugi raz.
9. **Nowy dokument.** Przeładowanie lub przejście na inną stronę czyści sprawdzanie, podgląd i listę; restart service workera usuwa tylko jego ulotny wynik wysyłki, nigdy nie powoduje ponownego wysłania.
10. **Ton.** Osoba 4 ocenia statusy, instrukcje i komunikaty: spokojny polski dla 9–13 lat, „odrzucone” nie brzmi jak wina dziecka.

## Jeśli Discord przechwytuje pisanie

Zgłoś problem z krokiem 4. Wariant przewidziany w researchu to panel w iframe strony rozszerzenia: własny dokument odcina klawiaturę od dokumentu Discorda. To zmiana architektury wymagająca osobnego wykonania i sprawdzenia CSP. Obecne testy nie udają tej izolacji. Jeśli kroki 7 lub 8 zawodzą, zgłoś błąd przywracania z paska.
