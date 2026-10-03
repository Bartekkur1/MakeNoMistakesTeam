# Taski zespołu — Cyberpomocnik

Zespół: 4 osoby. Zakres: jedna misja Roblox, pomocnik w przeglądarce, panel opiekuna i pomiar treningu. P0 = konieczne do demo, P1 = po ukończeniu P0. Godziny liczymy od rozpoczęcia pracy zespołu.

## Wspólny start — do 1 godziny

- [ ] Wybrać jeden scenariusz: oferta darmowego przedmiotu prowadząca do prośby o kod konta.
- [ ] Ustalić własnego awatara, nazwy przycisków i wspólny styl.
- [ ] Wybrać stack, sposób uruchomienia demo i adres backendu.
- [ ] Osoba 3 spisuje kontrakt API i przykładowe dane; osoba 2 potwierdza je przed implementacją.
- [ ] Ustalić fikcyjne profile dziecka i opiekuna. Przełączanie ról w demo oznaczyć jako demonstracyjne; nie jest zabezpieczeniem produkcyjnym.

## Osoba 1 — misja Roblox

### P0

- [ ] **R1: Sprawdzić uruchomienie i publikację.** Przygotować projekt Studio i ustalić, czy konto pozwoli udostępnić grę odbiorcom. Do 2 h zgłosić ograniczenia; przygotować pokaz w Studio jako wariant awaryjny.
- [ ] **R2: Zbudować mały level.** Start, spotkanie z NPC, podejrzana oferta, decyzja i zakończenie. Bez rozbudowanej mapy.
- [ ] **R3: Wdrożyć wybory i konsekwencje.** Sprawdzenie oferty, fikcyjne przekazanie kodu, odmowa i prośba o pomoc. Nie zbierać prawdziwego hasła ani kodu.
- [ ] **R4: Dodać pomocnika i wyjaśnienie.** Pokazać prośbę o kod, presję czasu i obietnicę nagrody zgodnie z treściami osoby 4. Błąd umożliwia ponowną próbę.
- [ ] **R5: Dodać wynik i nagrodę.** Punktacja według wspólnych zasad; jedna kosmetyczna nagroda za ukończenie ćwiczenia. Bez nagradzania rzeczywistych zgłoszeń.
- [ ] **R6: Przygotować przekazanie wyniku.** Eksport/zapis wyniku zgodny z kontraktem. Automatyczna integracja z backendem jest P1; przy imporcie ręcznym oznaczyć go w demo.

**Gotowe, gdy:** misję można przejść od początku do końca, zademonstrować poprawną i błędną decyzję, zobaczyć wyjaśnienie oraz odtworzyć misję. Wynik zawiera użycie podpowiedzi.

### P1

- [ ] Automatyczne wysyłanie wyniku do backendu z serwera Roblox, bez sekretów w kliencie.
- [ ] Drugi wariant pułapki lub dodatkowa nagroda kosmetyczna.

## Osoba 2 — platforma opiekuna i ekran testów

### P0

- [ ] **O1: Lista spraw.** Pokazać nowe i zakończone sprawy fikcyjnego dziecka: data, źródło i krótki opis.
- [ ] **O2: Szczegóły sprawy.** Wybrana treść, sygnały zagrożenia, działanie dziecka i odpowiedź na pytanie: „Czy już kliknąłeś, podałeś dane lub zapłaciłeś?”.
- [ ] **O3: Odpowiedź opiekuna.** Formularz odpowiedzi i zmiana statusu: nowa → w rozmowie → zakończona. Odpowiedź musi pojawić się u dziecka.
- [ ] **O4: Test przed–po.** Zbudować ekran z przykładami i odpowiedziami dostarczonymi przez osobę 4. W trybie testu wyłączyć pomocnika; wyjaśnienia pokazać po zakończeniu.
- [ ] **O5: Wyniki szkolne.** Pokazać liczbę uczestników, trafność działań przed–po i niepotrzebne alarmy. Przy braku odpowiedzi pokazać „brak danych”. Wyniki demo oznaczyć jako syntetyczne.
- [ ] **O6: Połączyć z API.** Najpierw użyć wspólnych danych przykładowych, następnie rzeczywistych zapisów z backendu osoby 3.

**Gotowe, gdy:** sprawa wysłana przez pomocnika pojawia się w panelu, opiekun odpowiada, a dziecko widzi odpowiedź. Test zapisuje odpowiedzi, a panel liczy wyniki zgodnie z zasadami. Widok nauczyciela nie pokazuje prywatnych spraw.

### P1

- [ ] Filtrowanie spraw i eksport zagregowanych wyników.
- [ ] Wizualizacja postępu według typu zagrożenia.

## Osoba 3 — pomocnik, rozszerzenie i backend

### P0

- [ ] **W1: Kontrakt i backend.** Udostępnić API spraw, odpowiedzi i wyników testu; zapisy zachować po odświeżeniu. Nie budować wspólnego logowania z Roblox.
- [ ] **W2: Rozszerzenie na komputer.** Uruchomienie awatara oraz przekazanie zaznaczonej treści albo ręczne wklejenie wiadomości/linku. Ograniczyć dostęp do strony do działania użytkownika.
- [ ] **W3: Ścieżka sprawdzania.** Kilka pytań: kto wysłał, czego żąda, czy jest presja czasu, czy można sprawdzić oficjalnym kanałem. Wdrożyć ustalone reguły i treści osoby 4; AI jest opcjonalne.
- [ ] **W4: Wynik pomocy.** Sygnały, brakujące informacje i proponowany krok. Bez gwarancji wiarygodności lub bezpieczeństwa.
- [ ] **W5: Przekazanie opiekunowi.** Podgląd danych przed wysłaniem, potwierdzenie zapisu i odczyt odpowiedzi. Oddzielić „Pokaż opiekunowi” od instrukcji zgłoszenia na platformie.
- [ ] **W6: Mobilna wersja.** Ta sama ścieżka jako strona do wklejenia tekstu/linku. Nie przedstawiać jej jako natywnego widgetu ani narzędzia czytającego inne aplikacje.
- [ ] **W7: Obsługa błędów.** Pusta treść, niedostępny backend i nieudany zapis mają czytelny komunikat; brak fałszywego potwierdzenia wysłania.

**Gotowe, gdy:** można przekazać fikcyjną wiadomość, przejść pytania, świadomie wysłać sprawę i zobaczyć odpowiedź opiekuna. Ścieżka działa na komputerze i w mobilnej przeglądarce.

### P1

- [ ] Zrzuty ekranu z podglądem i możliwością usunięcia danych przed wysłaniem.
- [ ] Analiza tekstu wspomagana AI z zachowaniem ustalonych reguł działania.

## Osoba 4 — treści, pomiar, gamifikacja i prezentacja

### P0

- [ ] **P1: Pakiet treści do 2 h.** Dostarczyć dialogi misji, pytania pomocnika, sygnały zagrożenia i wyjaśnienia prostym językiem.
- [ ] **P2: Dwa zestawy testowe do 3 h.** Po 4 nowe przykłady: wyłudzenie kodu, podszywanie się, ukryty koszt i uczciwa oferta. Zestawy A/B mają podobną trudność i różne treści. Nie kopiować scenariusza treningowego.
- [ ] **P3: Klucz oceny.** Dla każdego przykładu określić akceptowane działania i uzasadnienia. Propozycja: 0–2 pkt za działanie, 0–1 pkt za trafne uzasadnienie. Odpowiedź „poproszę o pomoc” oceniać zależnie od kontekstu.
- [ ] **P4: Definicje pomiaru.** Trafność = poprawne działania / udzielone odpowiedzi. Niepotrzebne alarmy = uczciwe przykłady błędnie oznaczone jako oszustwo / ocenione uczciwe przykłady. Pokazać liczebność i zmianę w punktach procentowych. Wyniki z pomocnikiem liczyć osobno.
- [ ] **P5: Zasady nagród.** Punkty za ćwiczenia i uzasadnienia, odznaka za ukończenie misji. Bez punktów za liczbę prawdziwych zgłoszeń, publicznego rankingu i kar za proszenie o pomoc.
- [ ] **P6: Weryfikacja projektu.** Sprawdzić z nauczycielem/opiekunem zrozumiałość ścieżki, jeśli dostępni. Testy z dorosłymi opisać jako test obsługi, nie dowód skuteczności u dzieci.
- [ ] **P7: Test integracyjny.** Przejść całą historię demo i spisać błędy; sprawdzić również uczciwą wiadomość oraz brak pewności pomocnika.
- [ ] **P8: Materiały zgłoszeniowe.** Prezentacja do 10 slajdów: problem, odbiorcy, konkurencja, wyróżnik, demo, pomiar, architektura, zakres wykonany i dalszy pilotaż. Sprawdzić aktualne wymagania zgłoszenia Defence i ujawnić użyte zasoby/AI.
- [ ] **P9: Demo i nagranie.** Krótki scenariusz pokazu, zapasowe nagranie i linki. Nie przedstawiać syntetycznych wyników jako badania dzieci.

**Gotowe, gdy:** osoby 1–3 mają treści i jednoznaczne zasady oceny, wyniki da się ręcznie przeliczyć, a prezentacja pokazuje działający produkt i granice dotychczasowej walidacji.

## Minimalny kontrakt integracji — właściciel: osoba 3

| Obiekt | Pola |
|---|---|
| Sprawa | id, demo_child_id, source, content, signals, selected_action, already_acted, status, created_at |
| Odpowiedź | id, case_id, message, created_at |
| Wynik testu/misji | participant_code, scenario_id, phase (pre/training/post), selected_action, justification, hints_used, score |

- API: utworzenie/lista/szczegóły sprawy, dodanie odpowiedzi, zmiana statusu, zapis odpowiedzi testowych i odczyt wyników.
- Opisy i klucz testów dostarcza osoba 4; backend wylicza wynik według tego klucza, nie przyjmuje punktów podanych przez klienta testu jako prawdy.
- Import wyników Roblox oznacza ich pochodzenie; nie mieszać treningu z testem samodzielności.
- Demo używa fikcyjnych profili. Produkcyjne uwierzytelnianie, przypisanie dziecka do opiekuna i kontrola dostępu wymagają dalszej implementacji przed użyciem z rzeczywistymi danymi.

## Wspólne kamienie milowe

| Termin | Wynik |
|---|---|
| 2–3 h | Treści, API i przykładowe dane gotowe; ryzyko publikacji Roblox rozpoznane |
| 8 h | Grywalna misja, działający pomocnik i panel opiekuna na wspólnych danych |
| 12 h | Sprawa przechodzi od dziecka do opiekuna, odpowiedź wraca |
| 17 h | Test przed–po, wyniki i nagrody działają; zamknięcie nowych funkcji |
| 21 h | Całe demo sprawdzone, prezentacja i nagranie gotowe |
| 24 h | Bufor i zgłoszenie; faktyczny deadline organizatora ma pierwszeństwo |

Jeżeli brakuje czasu: najpierw odłożyć AI, zrzuty ekranu, drugą misję i automatyczny zapis z Roblox. Zachować działającą wymianę dziecko–opiekun i pomiar testu przed–po.
