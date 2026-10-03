# Phase 1: Studio, publikacja i szkielet levelu - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Faza ma dać dwie rzeczy:
1. **Zbadaną publikację.** Do 2 h od startu zespół wie, czy grę da się opublikować z grupy Roblox zespołu, i ma przygotowany pokaz w Studio na wypadek, gdyby się nie dało (RBX-01).
2. **Szkielet misji, który da się przejść:** start → NPC-oszust → podejrzana oferta → decyzja → zakończenie → zagraj ponownie (MIS-01).

Faza 1 NIE obejmuje: pełnych wyborów i konsekwencji, logiki i wyjaśnień pomocnika, docelowych tekstów od osoby 4 (to faza 2) ani punktacji, nagrody i eksportu wyniku (faza 3).

</domain>

<decisions>
## Implementation Decisions

### Workflow Studio ↔ repo
- **D-01:** Projekt jest w repo w katalogu `roblox/` i synchronizowany przez **Rojo 7**. Skrypty to pliki `.luau` w `roblox/src/`, a strukturę opisuje `default.project.json`. — **Reversibility:** costly — zmiana później oznacza przeniesienie wszystkich skryptów i zmianę procesu pracy całego zespołu
- **D-02:** Geometria levelu jest składana w Studio i eksportowana jako modele `.rbxm` do `roblox/assets/` (lub podobnego katalogu), skąd Rojo je podpina. Cały place musi dać się odtworzyć z repo poleceniem `rojo build`.
- **D-03:** Wersje narzędzi są przypięte przez **Rokit** (albo Aftman) w pliku w repo (`rokit.toml`): Rojo 7, Selene, StyLua. Każdy instaluje je jednym poleceniem.
- **D-04:** Jakość kodu sprawdzają **Selene** (lint) i **StyLua** (formatowanie). Testów automatycznych nie ma, weryfikujemy przez Play w Studio.
- **D-05:** Nad levelem pracuje **kilka osób w Team Create**. Obowiązuje reguła: **skrypty pochodzą z Rojo** (ServerScriptService, ReplicatedStorage, StarterPlayer/StarterGui itd.), a **mapę (Workspace) edytuje się w Team Create**. Jeden właściciel co jakiś czas eksportuje mapę do `.rbxm` w repo. Kodu nie edytuje się bezpośrednio w Studio.

### Cel publikacji (RBX-01)
- **D-06:** Cel: gra **opublikowana z linkiem publicznym** (public albo unlisted), w którą jury i szkoła mogą zagrać same. Wariant awaryjny to pokaz w Studio.
- **D-07:** Właścicielem gry jest **grupa Roblox zespołu**. Członkowie publikują i pracują w Team Create bez udostępniania sobie kont.
- **D-08:** Wynik R1 to **krótka notatka `.md` w katalogu fazy** (np. `01-PUBLISHING.md`) i wiadomość z linkiem na czat zespołu, **do 2 h od startu**. Notatka zawiera: co sprawdzono, wymagania konta i grupy (wiek konta, weryfikacja, limity publikacji), ankietę dojrzałości treści (Maturity), ustawienia prywatności, status moderacji assetów i decyzję go/no-go.
- **D-09:** Ustawienia gry pod dzieci 10–13 lat: **wyłączony czat tekstowy i głosowy**, małe serwery (1–4 graczy), wypełniona ankieta Maturity z celem Minimal/Mild, **brak zakupów i monetyzacji**.
- **D-10:** Wariant awaryjny: **Play Solo z place'a zbudowanego z repo** (`rojo build`, potem Studio, potem Play) na laptopie do demo **oraz krótkie nagranie całego przejścia misji**, przekazane workstreamowi `presentation`.

### Sceneria i układ levelu (MIS-01)
- **D-11:** Akcja dzieje się na **placu handlowym w lobby gry** (stragany, wymiana przedmiotów), bo pasuje do prawdziwych oszustw na wymianie w Roblox.
- **D-12:** **Krótka ścieżka liniowa**: spawn → ścieżka ok. 20–40 studów → NPC → miejsce zakończenia. Przejście misji ma trwać 2–3 minuty i być łatwe do pokazania na demo.
- **D-13:** NPC-oszust to **zwykły awatar R15 udający innego gracza**, z nickiem w stylu „FreeRobux_Giver”. Chodzi o realizm: oszust wygląda jak kolega z gry.
- **D-14:** Pomocnik Scamerino **nie pojawia się w świecie 3D w fazie 1**. Będzie tylko w GUI, jako obrazek lub portret w oknie dialogu.
- **D-15:** Assety to **proste Parts i modele oficjalne lub od zweryfikowanych twórców**. **Nie wolno używać niesprawdzonych modeli z Toolbox**, bo mogą zawierać złośliwe skrypty.
- **D-16:** Grafikę `assets/Scamerino_Alertinio.png` **wgrywamy jako decal/obraz już w fazie 1**, razem z R1, bo moderacja może trwać od minut do godzin. Dopóki nie przejdzie moderacji, w GUI jest placeholder.

### Szkielet interakcji (MIS-01, przygotowanie pod MIS-02..04)
- **D-17:** Gracz zaczyna interakcję przez **ProximityPrompt przy NPC** (klawisz E lub dotknięcie ekranu), co otwiera **własne okno dialogu w ScreenGui** z tekstem NPC i przyciskami wyborów. Okno musi działać też na telefonie. Nie używamy wbudowanego obiektu `Dialog`.
- **D-18:** Teksty są w **module danych Luau** (np. `roblox/src/shared/MissionContent.luau`) pod kluczami, które później będą odpowiadać treściom osoby 4 w `.planning/shared/content/`. Na razie są tam tymczasowe teksty po polsku. Faza 2 podmienia dane bez zmian w kodzie GUI.
- **D-19:** Decyzja w fazie 1 ma **2 wybory i 2 zakończenia**: „Podaj kod” prowadzi do złego zakończenia, „Odmów” do dobrego. Struktura danych i GUI mają od początku mieścić 4 wybory z fazy 2 (sprawdzenie oferty, fikcyjne przekazanie kodu, odmowa, prośba o pomoc). Gracz **nigdy nie wpisuje prawdziwego kodu ani hasła**; „Podaj kod” to tylko przycisk.
- **D-20:** Etapami misji (start, NPC, oferta, decyzja, koniec) **steruje serwer**. Klient tylko wyświetla GUI i wysyła wybór przez RemoteEvent. Serwer sprawdza, czy wybór pasuje do bieżącego etapu, i nie ufa klientowi. Na tym opiera się punktacja i eksport w fazie 3.
- **D-21:** Na końcu jest **ekran końcowy** („Dobrze!” albo „Dałeś się oszukać”) z przyciskiem **„Zagraj ponownie”**, który resetuje stan misji i teleportuje gracza na start.
- **D-22:** Interfejs jest **tylko po polsku**.

### Claude's Discretion
- Nazwy plików i układ drzewa `roblox/src` (server/client/shared), nazwy RemoteEventów.
- Wygląd okna dialogu: kolory, fonty, rozmieszczenie. Ma być czytelne dla dzieci i działać na telefonie.
- Dokładne wymiary i dekoracje placu, o ile spełniają D-11, D-12 i D-15.
- Wybór między Rokit a Aftmanem.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Zakres i wymagania workstreamu
- `.planning/workstreams/roblox/ROADMAP.md` — cel i kryteria sukcesu fazy 1
- `.planning/workstreams/roblox/REQUIREMENTS.md` — RBX-01, MIS-01 (i MIS-02..04, SCR-01..03 jako przyszłe rozszerzenia, pod które przygotowujemy strukturę)
- `ideas/defence/taski.md` — zadania R1–R6 osoby 1, kamienie milowe (2–3 h: rozpoznane ryzyko publikacji; 8 h: misja, którą da się zagrać)
- `ideas/defence/koncepcja.md` — koncepcja produktu i miejsce misji Roblox w całości

### Zasady wspólne między workstreamami
- `.planning/shared/README.md` — kod w `roblox/`, `shared/` tylko do odczytu, właściciele plików
- `.planning/shared/CONTRACT.md` — brak sekretów w kliencie, `origin = roblox`, brak wspólnego logowania (ważne od fazy 3, ale ogranicza architekturę od początku)
- `.planning/shared/MEASUREMENT.md` — punktacja i nagrody (faza 3), tylko dla kontekstu
- `.planning/shared/content/` — **jeszcze nie istnieje**. Docelowe dialogi przygotuje osoba 4. Klucze w D-18 mają do niego pasować.
- `.planning/PROJECT.md` — ograniczenia: tylko fikcyjne dane, ~24 h, priorytety przy braku czasu

### Assety
- `assets/Scamerino_Alertinio.png` — grafika pomocnika (niebieski rekin-robot z kogutem alarmowym, tarczą z kłódką i lupą), do wgrania jako obraz do GUI

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Brak. W repo nie ma jeszcze kodu Roblox ani katalogu `roblox/`, to nowy projekt.
- `assets/Scamerino_Alertinio.png`: jedyny asset graficzny do użycia.

### Established Patterns
- Repo dzieli pracę na workstreamy z osobnymi katalogami kodu (`roblox/`, `api-ui/`, `widget/`, `presentation/`).
- Commity dokumentacji: `docs(...)`.

### Integration Points
- W fazie 1 brak. Od fazy 3: eksport wyniku w formacie z `.planning/shared/CONTRACT.md`, import ręczny oznaczony `origin = roblox`.

</code_context>

<specifics>
## Specific Ideas

- Oszust ma wyglądać jak zwykły gracz z „okazyjnym” nickiem (np. `FreeRobux_Giver`), a nie jak oczywisty złoczyńca.
- Scenariusz: oferta darmowego przedmiotu, za którą trzeba podać „kod konta” (zgodnie z `koncepcja.md`).
- Demo ma pokazać obie ścieżki, dobrą i złą, w 2–3 minuty.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-studio-publikacja-i-szkielet-levelu*
*Context gathered: 2026-10-03*
