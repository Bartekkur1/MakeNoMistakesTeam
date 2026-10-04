# Faza 2 — rozszerzenie zakresu

Ustalenia Roberta z 2026-10-03. Dotyczą obecnego Place 1 i rozszerzają wybory, konsekwencje oraz pomocnika o model 3D i ruch NPC. To zarys zakresu do szczegółowego planowania.

## Model Scamerino — MIS-05

Robert zgłosił, że zamiast torsu postać ma dziwny kwadrat. Trzeba sprawdzić aktualny model w Place 1, poprawić kształt, proporcje i połączenia torsu z głową i kończynami, zachowując rozpoznawalny wygląd Scamerino. Przyczyna defektu nie została jeszcze ustalona.

Kryterium odbioru: model wygląda spójnie w spoczynku i podczas chodzenia; nie rozpada się, a części nie zostają w miejscu ani nie przenikają przez siebie wskutek błędnych połączeń. Przed zmianą zachować kopię aktualnego modelu.

## Poruszający się scammer — MIS-06

Scammer chodzi po dostępnych fragmentach mapy i podchodzi do gracza. Zatrzymuje się w wygodnej odległości rozmowy, bez wchodzenia w postać gracza. Podczas dialogu pozostaje przy rozmówcy. Ruch musi uwzględniać przeszkody i przerwać nieaktualne podejście po restarcie misji lub zniknięciu gracza.

Aktualizacja po dyskusji GSD: rozmowa zaczyna się automatycznie po podejściu, bez klawisza E. Zaczepki pojawiają się w dymkach, a dalsza wymiana w symulowanym prywatnym czacie z odpowiedziami do wyboru. MatiBuilds i Scamerino mają dwie osobne historie rozmów. Szczegółowe decyzje i pierwszeństwo wobec wcześniejszych założeń opisuje `02-CONTEXT.md`.

Kryterium odbioru: w Play scammer porusza się po mapie, podchodzi do gracza i umożliwia rozmowę; nie teleportuje się do celu i nie przechodzi przez ściany.

## Podejście Scamerino na prośbę — MIS-07

Wybranie opcji pomocy w dialogu uruchamia podejście Scamerino do gracza, który poprosił o pomoc. Po dojściu pomocnik zatrzymuje się przy nim i uruchamia edukacyjną część rozmowy. Gracz dostaje informację, że pomocnik idzie; powtórne kliknięcie nie uruchamia kolejnych równoległych podejść.

Kryterium odbioru: Scamerino rzeczywiście podchodzi po wybraniu pomocy, gracz otrzymuje wskazówki i może kontynuować decyzję. Restart usuwa stan wezwania i przywraca zachowanie obu NPC. Przy braku ścieżki gra pokazuje czytelny komunikat zamiast zawieszać misję.

## Kolejność i granice

1. Odczytać aktualne modele i strukturę sceny Place 1; zachować kopię Scamerino.
2. Poprawić spójność modelu i przygotować go do chodzenia.
3. Dodać ruch i podejście scammera.
4. Rozbudować cztery ścieżki dialogu; powiązać prośbę o pomoc z podejściem Scamerino.
5. Sprawdzić całość w Play na komputerze: oba ruchy, przeszkody, decyzje, pomoc i restart.

Etapy misji i wybór gracza pozostają kontrolowane przez serwer. Kod synchronizujemy przez `sync.project.json`; modele i mapę przygotowujemy w Studio i eksportujemy do repo. Scamerino jako aktywny aktor 3D należy już do fazy 2; ograniczenie GUI-only w dokumentach fazy 1 dotyczyło poprzedniego etapu.

Test telefonu pozostaje odłożony zgodnie z wcześniejszą decyzją Roberta. Punktacja, nagroda i eksport wyniku należą do fazy 3.
