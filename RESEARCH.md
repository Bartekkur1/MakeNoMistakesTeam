# Research: „Żaden pomysł nie przepada" (HackYeah 2026, zadanie HubMI.pl)

> Dokument roboczy projektu. Zawiera: opis zadania, udokumentowane problemy (P1, P2, P4), wiedzę domenową o budżecie obywatelskim, koncepcję produktu, model danych, zakres MVP, scenariusz demo i pełną bibliografię.
> Odwołania w formie `[B3]`, `[I2]` itd. prowadzą do sekcji **Bibliografia** na końcu pliku.
> Stan wiedzy: 3 października 2026.

---

## 1. Streszczenie (TL;DR)

**Zadanie:** połączyć potrzeby mieszkańców ze sprawdzonymi rozwiązaniami i osobami gotowymi do działania tak, żeby dobre pomysły społeczne nie ginęły [H1].

**Nasz problem w jednym zdaniu:** pomysły mieszkańców i sprawdzone innowacje społeczne istnieją, ale ludzie, którzy ich potrzebują, nie widzą ich, a gdy pomysł odpada, nie ma dla niego dalszej ścieżki.

**Trzy udokumentowane problemy, jeden produkt:**

| # | Problem | Kto go zgłasza / mierzy | Kluczowa liczba |
|---|---|---|---|
| **P1** | Autorzy podobnych pomysłów w budżecie obywatelskim (BO) nie wiedzą o sobie nawzajem, brakuje narzędzia podpowiadającego podobne projekty i łączącego siły przed złożeniem wniosku | radni dzielnic, wnioskodawcy, urzędnicy w raporcie ewaluacji BO Kraków 2025 [B6] | 1152 zgłoszone projekty, ok. 185 do realizacji (≈16%) [B1] |
| **P2** | Po złożeniu wniosku autor nie widzi statusu, uzasadnienia bywają ogólne, terminy (lista poparcia, protest) umykają | j.w. [B6] + relacja medialna [B9] | wg UMK 96 projektów odpadło formalnie przez brak listy poparcia [B9] |
| **P4** | Samorządy chcą wdrażać sprawdzone mikroinnowacje, ale większość wniosków nie dostaje finansowania i nie ma dalszej ścieżki | operator programu „Innowacje w samorządzie" [I5][I9][I10] | II nabór: 193 wnioski, 42 skierowane do finansowania (22%) [I9] |

**Wspólny mianownik:** dopasowanie `pomysł/potrzeba ↔ podobne pomysły ↔ sprawdzone rozwiązanie ↔ ludzie` + śledzona ścieżka sprawy + „dalsza ścieżka" po porażce.

**Puenta do pitchu:** *„Raport miasta mówi, że pomysły znikają w systemie. My pokazujemy, dokąd trafiają dalej."*

---

## 2. Kontekst: zadanie i hackathon

- **Treść zadania (partner: HubMI.pl):** „Jak sprawić, by dobre pomysły na rozwiązywanie problemów społecznych nie pozostawały niezauważone? Wykorzystaj technologię, aby skuteczniej łączyć potrzeby mieszkańców z wiedzą, sprawdzonymi rozwiązaniami i osobami gotowymi do działania. Stwórz koncepcję, która pomoże wartościowym inicjatywom docierać tam, gdzie są najbardziej potrzebne, i ułatwi współpracę między mieszkańcami, instytucjami oraz organizacjami społecznymi." [H1]
- **Wydarzenie:** HackYeah 2026, 3–4 października, TAURON Arena Kraków, uczestnicy pełnoletni, zespoły do 6 osób [H1][H2]. Projekty można zgłaszać po polsku lub angielsku (adnotacja przy zadaniu).
- **Skala:** w poprzedniej edycji ponad 2600 uczestników, ponad 400 projektów, ponad 200 mentorów [H2].
- **Zadania mają charakter „open task":** organizator zarysowuje problem, nie narzuca rozwiązania [H5]. Oficjalna strona zadań (hackyeah.pl/tasks-prizes) ładuje opisy dynamicznie i nie dała się odczytać automatycznie [H4].

### Czego NIE udało się ustalić o HubMI.pl

- Nie znaleziono publicznych informacji, kim jest HubMI.pl (organizacja, platforma, użytkownicy). Wyszukiwanie zwraca niezwiązaną aplikację hubmi.app [H7].
- **Hipoteza robocza (przypuszczenie, nie fakt):** „MI" może oznaczać „mikroinnowacje". Treść zadania pasuje do ekosystemu innowacji społecznych finansowanego z FERS 5.1 (patrz sekcja 4.3).
- **Do zrobienia na miejscu:** sprawdzić stopkę hubmi.pl (logotypy FERS/UE, nazwa beneficjenta) i zapytać mentora partnera, kto jest docelowym użytkownikiem (urzędnik JST, innowator, mieszkaniec). Od odpowiedzi zależy, które wejście produktu pokażemy w demo jako pierwsze.

---

## 3. Dlaczego te trzy problemy naraz

Pojedynczo każdy z nich wygląda na wąski. Razem opisują jedną pętlę:

1. Mieszkaniec ma pomysł, ale nie widzi podobnych ani sprawdzonych rozwiązań (**P1**).
2. Wniosek wchodzi w proces, który jest dla niego nieprzejrzysty (**P2**).
3. Pomysł odpada lub przegrywa i znika, mimo że samorząd gdzie indziej szuka dokładnie takiego rozwiązania (**P4**).

Odrzucony pomysł mieszkańca staje się sygnałem popytu dla gminy, a gotowa innowacja z katalogu staje się „dalszą ścieżką" dla mieszkańca. Na tym opiera się spójna historia produktu.

---

## 4. Dowody: co mówią dane i dokumenty

### 4.1 P1 i P2: budżet obywatelski w Krakowie

**Skala (edycja 2025, XII):**

| Wskaźnik | Wartość | Źródło |
|---|---|---|
| Pula | 51 mln zł (10,2 mln ogólnomiejskie, 40,8 mln dzielnicowe) | [B1][B14] |
| Zgłoszone projekty | 1152 | [B1][B2] |
| Poddane pod głosowanie | 737 (141 ogólnomiejskich + 596 dzielnicowych) | [B1] |
| Do realizacji | 185 (komunikaty podają też 186) | [B1][B2][B3] |
| Głosy | 84 842 (2024: 72 942) | [B1] |
| Frekwencja | 12% (2024: 10%) | [B1] |
| Liczba zgłoszeń w 2026 (XIII edycja) | 821 złożonych, 424 ocenione pozytywnie (357 dzielnicowych, 67 ogólnomiejskich) | [B8] |

Wyliczenie własne: 185 / 1152 ≈ 16% zgłoszonych projektów trafia do realizacji. Do odpadnięcia prowadzą różne ścieżki (weryfikacja, przegrane głosowanie), więc liczby nie wolno czytać jako „16% jest dobrych".

**Co mówi raport ewaluacji BO 2025 (UMK, wykonawca: Pracownia Zrównoważonego Rozwoju)** [B6][B7]. *Streszczenie pochodzi z przebiegu deep research. Przed cytowaniem w pitchu otwórz oryginał [B6] i potwierdź sformułowania w rozdziałach „Weryfikacja projektów" i „Składanie i rozpatrywanie protestów".*

- Radni dzielnic: bank pomysłów nie pełni roli łącznika, brakuje narzędzia, które sugerowałoby podobne pomysły i pozwalało połączyć siły przed złożeniem wniosku (**P1**).
- Weryfikatorzy (urzędnicy jednostek miejskich) postulują wspólną bazę złożonych projektów i pracują „na mailach i plikach Excel" (**P1/P2**).
- Wnioskodawcy: brak informacji zwrotnej o postępach, niejasne uzasadnienia odrzuceń, utrudniony kontakt z weryfikatorem; poczucie, że wniosek „znika w systemie" (**P2**).
- Protesty: 77 złożonych, 21 projektów przywrócono do głosowania (**P2**).
- Dodatkowo: wnioskodawcy nie umieją ustalić własności i przeznaczenia terenu (**P3, poza zakresem MVP**).
- Zastrzeżenie samego raportu: ankieta wśród mieszkańców miała tylko 41 respondentów, dane mają charakter bardziej jakościowy niż ilościowy.

**Dodatkowe dowody dla P2:**

- Relacja Radia Eska z początku głosowania 2025 (cytuje rzecznika UMK): 290 projektów odrzucono, a 96 odpadło na etapie formalnym, bo nie dostarczono list poparcia; ta sama relacja wspomina opóźnienia realizacji projektów od 2 do prawie 11 lat oraz, że część mieszkańców nie wie, czym jest BO [B9]. Silny argument za przypomnieniami o terminie listy poparcia.
- Miasto samo wprowadziło w 2026 mechanizm „projektu wiodącego" dla dubli: gdy wnioskodawcy nie wskażą go w 7 dni od wezwania, wiodącym zostaje projekt złożony jako pierwszy z poprawną listą poparcia [B16]. Czyli problem dubli jest uznany, ale rozwiązywany po złożeniu wniosków, nie przed.
- Spór o projekty „Piłkarskie Marzenia" (miasto zapowiedziało analizę i zmiany regulaminu) pokazuje, że przejrzystość BO jest tematem politycznym [B17]. Nie budujemy na tym produktu.

### 4.2 Mieszkańcy i poczucie wpływu (tło dla P1/P2)

- CBOS, wrzesień 2025 (n = 969): 34% Polaków uważa, że ma wpływ na sprawy kraju; poczucie wpływu na sprawy swojej gminy utrzymuje się na poziomie z 2023 r. (61%), a 36% nie ma go w najbliższym otoczeniu [N8][N9].
- CBOS: osoby zaangażowane społecznie częściej czują sprawczość, a sprawczość zwiększa zaangażowanie (sprzężenie zwrotne) [N8].
- Wolontariat/aktywność: patrz sekcja 4.4.

### 4.3 P4: sprawdzone innowacje społeczne nie docierają do samorządów

**Pula rozwiązań:**

- W programie PO WER MFiPR sfinansowało 29 inkubatorów innowacji społecznych, które wsparły wypracowanie ponad 1200 mikro-rozwiązań. Upowszechniono ponad 150 z nich (≈12%) [I1].
- Obecnie trwa kolejny konkurs „Inkubacja i akceleracja innowacji społecznych": 7 inkubatorów, blisko 70 mln zł, ponad 230 nowych rozwiązań, w tym akceleracja (przygotowanie do skalowania) [I1].
- Ewaluacja pokazuje, co blokuje upowszechnianie: brak finansowania na upowszechnianie, zachowawcze postawy instytucji, wątpliwości, kto i jak ma upowszechniać [I3][I4]. *(Broszura [I4] oparta na fragmencie wyszukiwarki; PDF blokuje automatyczny odczyt.)*
- Samorząd płacący z publicznych środków nie zamawia eksperymentu, tylko usługę, która „nie może się nie udać". Potrzebuje „dysponenta wiedzy wdrożeniowej" i dlatego chętniej wdraża to, co już gdzieś działa [I5b].
- Wiejskie NGO wdrażają innowacje za małe pieniądze, ale często ich nie promują, nie monitorują i nie skalują, więc szybko znikają [I6].
- Autorzy innowacji dobrze znają siebie nawzajem w obrębie jednej dziedziny, ale brakuje forów między dziedzinami i otwartości władz publicznych (analiza Ashoki) [I7].

**Popyt samorządów:**

- Program „Innowacje w samorządzie" (Fundacja Fundusz Współpracy, FERS 5.1): katalog 30 przetestowanych mikroinnowacji w sześciu obszarach tematycznych, granty do 300 tys. zł dla JST [I5][I8].
- I nabór: 174 wnioski (m.in. ogrody terapeutyczne dla seniorów, Mobilne Centrum Pomocy dla Osób Starszych, „W lesie jak w domu"); pierwsze umowy podpisano w czerwcu 2026 [I10][I11][I12].
- II nabór (maj–czerwiec 2026): wg PAP 193 wnioski, 188 po ocenie formalnej, 42 skierowane do finansowania lub negocjacji po zwiększeniu alokacji do 7,8 mln zł, bo pula się wyczerpała [I9]. *Liczby z II naboru i I naboru (44 z 174) pochodzą z PAP przez deep research. Potwierdź na stronie operatora [I5] przed użyciem w pitchu.*
- **Wniosek interpretacyjny (nasz, nie operatora):** ponad 200 samorządów samo zgłosiło konkretną potrzebę i wybrało pod nią rozwiązanie. To gotowa „mapa popytu", z której po zamknięciu naboru nikt nie korzysta. Dokładna liczba unikalnych JST jest nieznana, bo część mogła aplikować w obu naborach.

**Co już istnieje (i czego nie powielamy):**

| Narzędzie | Co robi | Luka względem naszego pomysłu |
|---|---|---|
| Innowacje społeczne (portal wiedzy) [I13] | zbiera wiedzę, słownik, aktualności | nie dopasowuje do potrzeby konkretnej gminy |
| Katalog 30 innowacji FFW [I5][I8] | lista gotowych modeli | statyczny katalog, bez dopasowania, bez „kto już wdrożył" |
| Baza Dobrych Praktyk ZMP/ZPP/ZGW (od 2007) [G1][G2] | opisy dobrych praktyk samorządowych | baza do przeglądania, nie system dopasowań |
| INNOES, Laboratorium Innowacji Społecznych Gdynia, inkubatory [I14][I15] | bazy i inkubacja innowacji | j.w. |
| Europejska baza innowacji społecznych (w budowie) [I16] | widoczność inicjatyw, partnerstwa | poziom UE, nie lokalne dopasowanie |
| Partnerska Inicjatywa Miast [G3] | sieci tematyczne miast | wymiana wiedzy, nie narzędzie |
| BO Kraków (platforma) [B5] | zgłaszanie i głosowanie | brak podpowiedzi podobnych pomysłów i dalszej ścieżki |

Nie znaleziono podczas researchu narzędzia, które łączyłoby pomysły mieszkańców z BO z katalogiem sprawdzonych innowacji i popytem samorządów. To jest teza o nowatorstwie, którą warto zweryfikować u mentora.

### 4.4 Grupy docelowe i organizacje społeczne (tło dla matchmakingu)

Raport „Kondycja organizacji pozarządowych 2024" (Klon/Jawor, n = 1012) [N1]:

- ~75 tys. aktywnych organizacji (161 tys. zarejestrowanych), przeciętny roczny przychód 50 tys. zł, 34% działa wyłącznie dzięki pracy społecznej.
- 72% ma trudności w zdobywaniu funduszy, 61% brakuje osób gotowych do zaangażowania, 58% nie ma następców dla liderów.
- 78% współpracuje z samorządem lokalnym, 80% z lokalną społecznością; 93% jest w internecie, 29% używa narzędzi opartych na AI.
- Zmiana modelu zaangażowania: z długoterminowego na akcyjne i doraźne; młodsi wolą krótkie, elastyczne projekty [N1][N3].

Wolontariat:

- Tylko ok. 31% organizacji organizujących wolontariat nie ma ani jednego regularnego wolontariusza [N4]; wolontariat jest nieregularny i akcyjny.
- Walkowska (Korpus Solidarności, ngo.pl, grudzień 2025): wolontariusze nie znajdują zadań dopasowanych do swoich kompetencji, a oferty są słabo komunikowane [N5].
- Deklaracje różnią się zależnie od metodologii: 7% Polaków wg rankingu cytowanego w mediach [N6], ok. co piąty wg starszych badań Klon/Jawor [N7]. Nie zestawiać w jednym zdaniu.
- Urzędy: wg badania ISP cytowanego przez ngo.pl 60% urzędów nie prowadzi bazy lokalnych NGO [G4]; skargi NGO, że uwagi „idą do szuflady" [G5]. **Dane starsze niż 2024**, a Klon/Jawor 2024 notuje dobre oceny współpracy z samorządem lokalnym [N1], więc używać ostrożnie.

**Priorytet grup (dla projektu):**

1. **Mieszkaniec z pomysłem** (wejście: P1, P2).
2. **Urzędnik gminy / OPS / weryfikator BO** (wejście: P4, część P1/P2).
3. **Autor innowacji / małe NGO** (strona podaży w P4).
4. Wolontariusz (poza MVP, opcja rozszerzenia).

---

## 5. Wiedza domenowa: jak działa BO w Krakowie

*Dane z oficjalnych stron miasta. Formularz online i szczegóły zmieniają się co edycję, więc przed budową makiet otwórz aktualną instrukcję [B12].*

**Przebieg (edycja 2026, XIII):**

1. **Konto i formularz online** na budzet.krakow.pl, 16 lutego–17 marca 2026; wersje papierowe nie są przyjmowane [B10]. Formularz: rodzaj projektu (ogólnomiejski/dzielnicowy), kategoria, tytuł, opis, miejsce realizacji, harmonogram, orientacyjny kosztorys [B10]. Konto wymaga m.in. imienia, nazwiska i pełnego adresu zamieszkania [B13].
2. **Lista poparcia:** min. 15 podpisów mieszkańców miasta (projekt ogólnomiejski) lub dzielnicy (dzielnicowy). Dostarczyć w ciągu 10 dni od złożenia projektu, inaczej odrzucenie z przyczyn formalnych [B11]. Dopuszczone podpisy papierowe i elektroniczne z identyfikacją osoby [B16]. Drogi dostarczenia: dziennik podawczy UMK, Klaster Innowacji Społeczno-Gospodarczych (ul. Zabłocie 22), list polecony do Wydziału Dialogu, Konsultacji i Kontaktu Obywatelskiego, e-mail dla podpisów elektronicznych [B11]. *Starsze strony miasta podają 5 dni roboczych lub 7 dni (nieaktualne) [B13][B15].*
3. **Warunki merytoryczne:** teren należący do Gminy Miejskiej Kraków, zgodność z prawem i planami miasta, ogólnodostępność i bezpłatność dla mieszkańców [B10][B14]. Koszt projektu ogólnomiejskiego: 25 tys.–2 mln zł (w 2025) [B14].
4. **Weryfikacja i protesty:** jednostki miejskie oceniają wykonalność. W 2025 wyniki do 9 czerwca, protesty 9–19 czerwca [B14]. Rozpatruje je Rada Budżetu Obywatelskiego (protokoły w BIP [B7]).
5. **Lista do głosowania** (w 2025 do 18 lipca), **głosowanie** (19 września–3 października 2025), **wyniki** do 30 października, **zatwierdzenie do realizacji** do 14 listopada [B14].
6. **Realizacja** w kolejnym roku, czasem z wieloletnimi opóźnieniami [B9].

**Dubli dotyczy:** zasady „projektu wiodącego" i łączenia wnioskodawców opisuje uchwała Rady Miasta Krakowa nr XLV/926/26 z 21 stycznia 2026 (wzór listy poparcia w załączniku) [B16].

**Konsekwencje dla produktu:**

- Tracker statusu ma modelować etapy 1–6 i terminy (lista poparcia, protest).
- Checklista „czy projekt jest kompletny" (grunt miejski, ogólnodostępność, koszt, 15 podpisów) wprost odpowiada na przyczyny odpadania.
- Wersja demo może działać na danych z kilku edycji, bez logowania do systemu miasta.

---

## 6. Koncepcja produktu

**Nazwa robocza:** „Żaden pomysł nie przepada" (do zmiany).

**Jedna jednostka danych: „sprawa"** (pomysł mieszkańca albo potrzeba gminy), jeden silnik dopasowań, jedna oś czasu. Trzy widoki:

1. **Mieszkaniec pisze pomysł (P1).** W trakcie pisania widzi: podobne pomysły z BO (ta i poprzednie edycje, w tym zrealizowane i przegrane), pasujące innowacje z katalogu, przycisk „połącz siły z autorem". Walidator kompletności: grunt, koszt, ogólnodostępność, lista poparcia.
2. **Ścieżka sprawy (P2).** Oś czasu jak przy przesyłce: złożony → lista poparcia (odliczanie dni) → weryfikacja → wynik z uzasadnieniem → termin protestu → głosowanie → realizacja. Przypomnienia o terminach (w demo: mock SMS/e-mail na ekranie).
3. **Dalsza ścieżka (spinacz P1+P2+P4).** Gdy projekt odpada lub przegrywa: podobne projekty, które wygrały, pasująca innowacja z katalogu, NGO lub gmina, które to już robią, kontakt do autora.
4. **Widok urzędnika / OPS (P4).** Wpisuje problem („samotność seniorów na wsi"), dostaje innowacje z katalogu, gminy, które je wdrożyły (do kogo zadzwonić), autora, **oraz pomysły mieszkańców z jego terenu na ten temat jako dowód popytu**. Weryfikator BO widzi grupy zdublowanych wniosków.

**Dlaczego to jest „technologia dla zadania":** dopasowanie semantyczne (embeddingi) + LLM, który tłumaczy, *dlaczego* coś pasuje i *co dalej zrobić*.

### Proponowany model danych (szkic)

```jsonc
// Idea: pomysł mieszkańca (BO) lub potrzeba gminy
{
  "id": "bo-2025-krk-0123",
  "kind": "resident_idea | municipal_need",
  "source": { "type": "bo_krakow", "edition": 2025, "url": "..." },
  "title": "", "description": "", "category": "", "district": "",
  "cost_estimate": 0,
  "status": "submitted | verified | rejected | voted_won | voted_lost | implemented",
  "rejection_reason": null,          // np. "grunt_nie_miejski", "brak_listy_poparcia"
  "timeline": [ { "stage": "", "date": "", "note": "" } ],
  "embedding": []                    // wektor opisu
}

// Innovation: sprawdzone rozwiązanie z katalogu
{
  "id": "inn-ffw-07",
  "name": "Mobilne Centrum Pomocy dla Osób Starszych",
  "area": "",                        // jeden z 6 obszarów katalogu
  "problem": "", "target_group": "", "description": "",
  "author_org": "", "implementers": [ { "gmina": "", "year": 2026 } ],
  "source_url": "", "embedding": []
}

// Match: wynik dopasowania
{ "from": "idea-id", "to": "idea-id | innovation-id",
  "score": 0.0, "reason": "wyjaśnienie LLM", "next_step": "" }
```

### Silnik dopasowań (propozycja)

1. Embeddingi `title + description` dla Idea i Innovation (model wielojęzyczny, polski).
2. Wyszukiwanie top-k po podobieństwie kosinusowym, filtr po dzielnicy/kategorii.
3. LLM generuje 1–2 zdania uzasadnienia i „następny krok" (kontakt, gmina, wniosek).
4. Reguły „dalszej ścieżki": status `rejected`/`voted_lost` → szukaj najpierw wygranych podobnych, potem innowacji, potem NGO/gmin wdrażających.

---

## 7. Dane: skąd je wziąć

| Zbiór | Skąd | Uwagi |
|---|---|---|
| Projekty BO Kraków (2–3 edycje, ze statusem) | budzet.krakow.pl, listy projektów w BIP [B5][B7] | scraping lub ręcznie ~50 projektów; to wystarczy do demo |
| Katalog 30 innowacji | innowacjewsamorzadzie.pl [I5][I8], opis obszarów | ręcznie do JSON |
| Gminy wdrażające innowacje | listy wyników naborów w PAP [I9][I10], komunikaty FFW [I11][I12] | do pola `implementers` |
| Statystyki z sekcji 4 | Klon/Jawor [N1], CBOS [N8] | do slajdów |
| Statusy i terminy w trackerze | mock na podstawie sekcji 5 | nie integrujemy z systemem miasta |

Regulamin i licencje: dane BO są publiczne, ale przed publikacją repo sprawdź warunki ponownego użycia. Dane osobowe wnioskodawców nie powinny trafić do repo.

---

## 8. Zakres MVP na 24 godziny

**W zakresie:**

- Widok „mieszkaniec pisze pomysł" z podpowiedziami podobnych pomysłów i innowacji.
- Oś czasu sprawy z odliczaniem do terminu listy poparcia (mock powiadomienia).
- Ekran „dalsza ścieżka" po odrzuceniu.
- Widok urzędnika: problem → innowacje → gminy → pomysły mieszkańców jako popyt.

**Poza zakresem (świadomie):** logowanie, integracja z systemem miasta, mapy i działki (P3), moduł wolontariatu, wiele miast, prawdziwe powiadomienia.

**Podział pracy (szkic):** dane i embeddingi (kto), back-end dopasowań i LLM (kto), front trzech widoków (kto), pitch i slajdy z liczbami (kto). Uzupełnić po ustaleniu składu zespołu.

---

## 9. Scenariusz demo (3 minuty) i pitch

1. Mieszkanka wpisuje: „zajęcia dla samotnych seniorów w Nowej Hucie".
2. Widzi trzy podobne pomysły, w tym jeden, który wygrał w sąsiedniej dzielnicy, i łączy się z jego autorem.
3. Śledzi wniosek na osi czasu: odliczanie do listy poparcia, weryfikacja, głosowanie. Projekt przegrywa.
4. System pokazuje „dalszą ścieżkę": innowacja z katalogu (np. Mobilne Centrum Pomocy), gmina, która ją wdrożyła, kontakt.
5. Przełączenie na widok OPS: urzędnik widzi ten pomysł jako sygnał popytu i autora innowacji.

**Liczby do pitchu (każda z przypisem):**

- ok. 16% zgłoszonych projektów BO Kraków 2025 trafia do realizacji (1152 → ok. 185) [B1].
- ok. 12% mikroinnowacji z inkubatorów PO WER zostało upowszechnionych (150 z 1200+) [I1].
- 22–25% wniosków gmin w „Innowacje w samorządzie" dostaje finansowanie [I9] *(zweryfikować przed użyciem)*.
- 61% organizacji pozarządowych brakuje chętnych do zaangażowania [N1].

**Cytat-hak (z raportu miasta, parafraza):** brakuje narzędzia, które podpowiadałoby podobne pomysły i pozwalało połączyć siły przed złożeniem wniosku [B6].

---

## 10. Ryzyka, rozbieżności i luki

- **Tożsamość HubMI.pl nieustalona.** Hipoteza „mikroinnowacje" wymaga potwierdzenia (sekcja 2).
- **Źródła „z fragmentu":** część linków (oznaczona w bibliografii statusem `snippet`) była dostępna tylko jako fragment wyszukiwarki. Przed cytowaniem w pitchu otwórz oryginał.
- **Liczby z deep research** dla raportu ewaluacji BO [B6] (77 protestów, 21 przywróconych, 41 ankietowanych) i naborów FFW [I9] wymagają potwierdzenia w oryginałach.
- **Rozbieżne liczby w mediach:** do realizacji 185 lub 186 projektów w BO 2025 [B1][B2][B3].
- **Rozbieżne terminy listy poparcia:** 5 dni roboczych / 7 dni / 10 dni zależnie od roku i strony. Obowiązuje 10 dni [B11].
- **Brak głosów „z ulicy".** Nie znaleziono publicznych skarg konkretnych mieszkańców (fora, social media, petycje w BIP) potwierdzających P1/P2. Najmocniejsze dowody to dokumenty instytucji. Dobrym uzupełnieniem byłyby 2–3 cytaty z lokalnych mediów lub rozmów.
- **Dane starsze niż 2024** (ISP o bazach NGO w urzędach [G4], część wolontariatu [N7]) traktować jako tło.
- **Tezę o nowatorstwie** („nie ma narzędzia łączącego BO z katalogiem innowacji i popytem JST") oparto na ograniczonym przeglądzie. Sprawdzić u mentora.
- **Rynek wolontariatu jest zatłoczony** (wolontariat.org.pl, Szlachetna Paczka, ogłoszenia MOPS Kraków [N10]), dlatego wolontariusze są poza MVP.

---

## 11. Pytania do mentora partnera (HubMI.pl)

1. Kim jest główny użytkownik: urzędnik JST, innowator społeczny czy mieszkaniec?
2. Czy HubMI.pl ma własne dane (katalog innowacji, baza potrzeb), których możemy użyć w demo?
3. Czy „sprawdzone rozwiązania" oznaczają mikroinnowacje z inkubatorów FERS/PO WER?
4. Według jakich kryteriów oceniane jest zadanie (wpływ społeczny, wykonalność, innowacyjność)?
5. Czy dane o projektach BO i innowacjach możemy publikować w repo?

---

## 12. Bibliografia

**Status:** `przeczytane` = otwarta i przeczytana pełna treść; `snippet` = tylko fragment z wyszukiwarki; `dr` = informacja z deep research, do potwierdzenia w oryginale.

### H: HackYeah i zadanie

| ID | Opis | Status | URL |
|---|---|---|---|
| H1 | WSIiZ: TEAM WSIiZ jedzie na HackYeah 2026 (lista zadań, w tym HubMI.pl, zasady udziału) | przeczytane | https://wsiz.edu.pl/aktualnosci/team-wsiiz-jedzie-na-hackyeah-2026-dolacz-do-najwiekszego-hackathonu-w-europie/ |
| H2 | MamStartup: HackYeah 2026 wraca do Krakowa (kategorie, skala poprzedniej edycji) | snippet | https://mamstartup.pl/hackyeah-2026-wraca-do-krakowa-najwiekszy-stacjonarny-hackathon-w-europie-ponownie-zgromadzi-tysiace-uczestnikow/ |
| H3 | MamStartup: 24 godziny, tysiące twórców (ImpactHer, SheHacks) | snippet | https://mamstartup.pl/24-godziny-tysiace-tworcow-i-jeden-cel-stworzyc-technologie-przyszlosci-hackyeah-2026-wraca-do-krakowa/ |
| H4 | HackYeah: zadania i nagrody (opisy ładowane dynamicznie) | dr | https://hackyeah.pl/tasks-prizes |
| H5 | Girls Code Fun: HackYeah 2026 (Open Tasks, kategorie) | snippet | https://girlscodefun.pl/projekty/hack-yeah-2026-girls-code-fun/ |
| H6 | Magazyn Programista: HackYeah 2026 | snippet | https://programistamag.pl/hackyeah-2026-najwiekszy-stacjonarny-hackathon-w-europie-3-4-pazdziernika-2026/ |
| H7 | hubmi.app (niezwiązana aplikacja, nie partner zadania) | snippet | https://www.hubmi.app/ |

### I: Innowacje społeczne

| ID | Opis | Status | URL |
|---|---|---|---|
| I1 | MFiPR: Wspieramy innowacje społeczne, inkubatory (29 inkubatorów, 1200+ rozwiązań, 150+ upowszechnionych, nowy konkurs ~70 mln zł) | snippet | https://www.gov.pl/web/fundusze-regiony/wspieramy-innowacje-spoleczne---uruchamiamy-inkubatory-innowacji-spolecznych |
| I2 | MFiPR: Innowatorzy społeczni (pilotaż: 600+ pomysłów, 70 rozwiązań) | snippet | https://www.gov.pl/web/fundusze-regiony/innowatorzy-spoleczni |
| I3 | Raport końcowy z badania innowacji społecznych w PO WER | snippet | https://www.power.gov.pl/media/114679/Raport_podsumowujacy_badanie.pdf |
| I4 | Ewaluacja innowacji społecznych w PO WER (broszura; PDF blokuje odczyt) | snippet | https://www.power.gov.pl/media/56882/Broszura_FINAL.pdf |
| I5 | Innowacje w samorządzie (strona projektu FFW, katalog 30 mikroinnowacji, granty do 300 tys. zł) | snippet | https://innowacjewsamorzadzie.pl/ |
| I5b | Innowacje społeczne w instytucjach publicznych: przygoda czy zobowiązanie? | snippet | https://innowacjespoleczne.pl/aktualnosc/innowacje-spoleczne-w-instytucjach-publicznych-przygoda-czy-zobowiazanie-dzialalnosc-na-obrzezach-czy-glowny-nurt/ |
| I6 | Innowacje społeczne na wsi: po co, dla kogo, jak i z kim? | snippet | https://innowacjespoleczne.pl/artykuly/innowacje-spoleczne-na-wsi-po-co-dla-kogo-jak-i-z-kim/ |
| I7 | Ashoka: Bariery rozwoju skutecznych innowacji społecznych | snippet | https://www.ashoka.org/pl-pl/story/bariery-rozwoju-skutecznych-innowacji-spo%C5%82ecznych-inspiracje-czeskie |
| I8 | Katalog innowacji do wdrożenia przez JST (opis 30 innowacji, 6 obszarów) | snippet | https://innowacjewsamorzadzie.pl/w-wyzwania-demograficzne-a-innowacje-spoleczne-jak-samorzady-sie-przygotowuja/ |
| I9 | PAP: Innowacje w samorządzie, wyniki II naboru (193 wnioski, 42 do finansowania) | dr | https://samorzad.pap.pl/kategoria/dofinansowanie/innowacje-w-samorzadzie-sa-wyniki-naboru-wnioskow-lista |
| I10 | PAP: Ponad 7 mln zł na innowacje w samorządzie, wyniki I naboru | dr | https://samorzad.pap.pl/kategoria/dofinansowanie/ponad-7-mln-zl-na-innowacje-w-samorzadzie-sa-wyniki-naboru-wnioskow-lista |
| I11 | Infor.pl: Innowacje w samorządzie 2026, granty do 300 tys. zł na 30 gotowych rozwiązań | snippet | https://samorzad.infor.pl/sektor/rozwoj_i_promocja/fundusze_unijne/7614150,innowacje-w-samorzadzie-2026-granty-fundusze-europejskie-rozwiazania-spoleczne-gminy-miasta-seniorzy-dzieci-mlodziez.html |
| I12 | MFiPR: pierwsze umowy grantowe, 174 wnioski (przykłady: Ogród leczy, Mobilne Centrum Pomocy) | snippet | https://www.gov.pl/web/fundusze-regiony/ogrody-ktore-lecza-mobilne-centra-pomocy-dla-seniorow-i-wiele-innych-innowacji-spolecznych--pierwsze-odwazne-samorzady-dostana-miliony-na-ich-realizacje-za-nami-uroczyste-podpisanie-umow-na-pomysly-ktore-zmieniaja-zycie-mieszkancow |
| I12b | Fundusz Współpracy: relacja z podpisania umów | snippet | https://cofund.org.pl/ogrody-ktore-lecza-mobilne-centra-pomocy-dla-seniorow-i-wiele-innych-mikroinnowacji-spolecznych-pierwsze-odwazne-samorzady-dostana-miliony-na-ich-realizacje-przed-nami-uroczyste-podpisani/ |
| I13 | Innowacje społeczne: portal wiedzy, aktualności, nabory | snippet | https://innowacjespoleczne.pl/aktualnosc/nabor-wnioskow-w-programie-innowacje-w-samorzadzie/ |
| I14 | INNOES: baza innowacji społecznych | snippet | https://innoes.pl/baza-innowacji-spolecznych/ |
| I15 | Laboratorium Innowacji Społecznych Gdynia: inkubator (14 przetestowanych innowacji) | snippet | https://lis.gdynia.pl/inkubator/ |
| I16 | EFS+: innowacje społeczne i baza danych na poziomie UE | snippet | https://european-social-fund-plus.ec.europa.eu/pl/innowacje-spoleczne-i-wspolpraca-transnarodowa |
| I17 | ROPS Kraków: Inkubator Włączenia Społecznego 2.0 (granty, innowacje dla osób wykluczonych) | snippet | https://rops.krakow.pl/realizowane-projekty-i-zadania/inkubator-wlaczenia-spolecznego-20,o-projekcie |
| I18 | Fundusze Europejskie dla Małopolski: Inkubator Włączenia Społecznego (60 pomysłów) | snippet | https://fundusze.malopolska.pl/aktualnosc/6878-malopolska-stawia-na-innowacyjne-rozwiazania-spoleczne |
| I19 | ROPS Kraków: 9 innowacji wybranych do upowszechniania | snippet | https://rops.krakow.pl/innowacje-spoleczne/liderzy-wlaczenia-spolecznego-9-innowacji-spolecznych-inkubatora-wlaczenia-spolecznego-wybranych-do-upowszechniania |
| I20 | Dylematy praktyczne: ewaluacja mikroinnowacji (poradnik) | snippet | https://innowacjespoleczne.pl/wp-content/uploads/2024/01/Dylematy_praktyczne_subiektywny_poradnik_ewaluacja.pdf |
| I21 | UEK: Hub Innowacji Społecznych i Włączających | snippet | https://biznes.uek.krakow.pl/hub-innowacji-spolecznych-i-zrownowazonych/ |

### G: Samorząd i współpraca z NGO

| ID | Opis | Status | URL |
|---|---|---|---|
| G1 | Baza Dobrych Praktyk (ZPP) | snippet | https://zpp.pl/artykul/70-baza-dobrych-praktyk |
| G2 | Baza Dobrych Praktyk (Związek Miast Polskich) | snippet | https://www.miasta.pl/strony/baza-dobrych-praktyk |
| G3 | Partnerska Inicjatywa Miast (MIiR) | snippet | https://www.miir.gov.pl/strony/strategia-na-rzecz-odpowiedzialnego-rozwoju/kluczowe-projekty/partnerska-inicjatywa-miast |
| G4 | ngo.pl: Partycypacja, indywidualnie czy grupowo (60% urzędów bez bazy NGO, dane ISP) | dr | https://publicystyka.ngo.pl/partycypacja-indywidualnie-czy-grupowo |
| G5 | Prawo.pl: współpraca NGO z samorządem | dr | https://www.prawo.pl/samorzad/wspolpraca-ngo-z-samorzadem-organizacje-pozarzadowe-sa,507164.html |

### N: NGO, wolontariat, postawy obywatelskie

| ID | Opis | Status | URL |
|---|---|---|---|
| N1 | Klon/Jawor: Kondycja organizacji pozarządowych 2024, skrót raportu | przeczytane | https://api.ngo.pl/media/get/271556 |
| N2 | ngo.pl: strona raportu Kondycja 2024 | snippet | https://fakty.ngo.pl/raporty/kondycja-organizacji-pozarzadowych-2024-bkj |
| N3 | ngo.pl: Mapa pokoleń sektora społecznego (36% liderów: młodsi preferują działania akcyjne) | snippet | https://publicystyka.ngo.pl/mapa-pokolen-sektora-spolecznego-kto-dziala-w-fundacjach-i-stowarzyszeniach-tau |
| N4 | fakty.ngo.pl: Wolontariat w organizacjach (31% bez regularnego wolontariusza) | dr | https://fakty.ngo.pl/fakt/wolontariat-w-organizacjach |
| N5 | ngo.pl: Rok Wolontariatu 2026 w Korpusie Solidarności (Walkowska, grudzień 2025) | dr | https://publicystyka.ngo.pl/rok-wolontariatu-2026-w-korpusie-solidarnosci-diagnoza-wyzwania-i-zmiany |
| N6 | Obserwator Gospodarczy: zaangażowanie Polaków w wolontariat (7%, styczeń 2025) | snippet | https://obserwatorgospodarczy.pl/2025/01/24/zaangazowanie-polakow-w-wolontariat-jest-dramatycznie-niskie/ |
| N7 | ngo.pl: Zaangażowanie społeczne w organizacjach czy poza nimi (starsze badanie) | snippet | https://publicystyka.ngo.pl/zaangazowanie-spoleczne-w-organizacjach-czy-poza-nimi |
| N8 | CBOS: Poczucie wpływu obywateli na sprawy publiczne (wrzesień 2025) | snippet | https://www.cbos.pl/SPISKOM.POL/2025/K_097_25.PDF |
| N9 | Polsat News: sondaż CBOS o wpływie na sprawy kraju i gminy | snippet | https://www.polsatnews.pl/wiadomosc/2025-10-10/polacy-bezsilni-wobec-spraw-w-kraju-sondaz-nie-pozostawia-watpliwosci/ |
| N10 | ngo.pl: Nasz wspólny dom! Wolontariat w lokalnych organizacjach | dr | https://publicystyka.ngo.pl/nasz-wspolny-dom-wolontariat-w-lokalnych-organizacjach |
| N11 | Wolontariat.org.pl: Kraków (istniejący serwis ogłoszeń) | dr | https://www.wolontariat.org.pl/wolontariat/krakow/ |
| N12 | MOPS Kraków: zaproszenie do wolontariatu | dr | https://mops.krakow.pl/start/211528,artykul,miejski_osrodek_pomocy_spolecznej_w_krakowie_zaprasza_osoby_zainteresowane_wolontariatem_.html |

### B: Budżet obywatelski Krakowa

| ID | Opis | Status | URL |
|---|---|---|---|
| B1 | ZDMK: wyniki BO 2025 (1152 projekty, 737 do głosowania, 84 842 głosy, frekwencja 12%) | snippet | https://zdmk.krakow.pl/nasze-dzialania/projekty-ktore-zmieniaja-krakow-poznaj-wyniki-budzetu-obywatelskiego-2025/ |
| B2 | Magiczny Kraków: wyniki BO 2025 | snippet | https://krakow.pl/aktualnosci/300354,29,komunikat,projekty__ktore_zmieniaja_krakow___poznaj_wyniki_budzetu_obywatelskiego_2025.html |
| B3 | Obywatelski Kraków: wyniki BO 2025 (wersja z 186 projektami) | snippet | https://obywatelski.krakow.pl/aktualnosci/300353,2144,komunikat,projekty__ktore_zmieniaja_krakow___poznaj_wyniki_budzetu_obywatelskiego_2025.html |
| B4 | Gazeta Krakowska: wyniki BO i lista projektów | snippet | https://gazetakrakowska.pl/oto-wyniki-krakowskiego-budzetu-obywatelskiego-te-projekty-zostana-zrealizowane/ar/c1p2-28130823 |
| B5 | Budżet Obywatelski Krakowa: strona główna (platforma, głosowanie) | snippet | https://budzet.krakow.pl/ |
| B6 | BIP Kraków: Raport z ewaluacji XII edycji BO (PDF) | dr | https://bip.krakow.pl/plik.php?mode=shw&new=t&wer=0&zid=634543 |
| B7 | BIP Kraków: dokumenty XII edycji (raport, listy projektów, protokoły Rady BO, zarządzenie 2696/2025) | snippet | https://www.bip.krakow.pl/?dok_id=212383 |
| B8 | ZDMK: BO, 13. edycja (821 projektów, 424 pozytywnie zweryfikowane) | snippet | https://zdmk.krakow.pl/dzialania/budzet-obywatelski/ |
| B9 | Radio Eska Kraków: BO, zaczyna się głosowanie (96 odpadło formalnie, opóźnienia 2–11 lat) | snippet | https://krakow.eska.pl/budzet-obywatelski-w-krakowie-juz-dzis-zaczyna-sie-glosowanie-aa-ZoKx-QX3Z-VUNX.html |
| B10 | Dzielnica XV: zgłaszanie projektów 2026 (terminy 16.02–17.03, formularz, 15 podpisów) | snippet | https://www.dzielnica15.krakow.pl/aktualnosci/aktualnosci-2026/budzet-obywatelski-miasta-krakowa-zglaszanie-projektow |
| B11 | Budżet Obywatelski: Lista poparcia (18.02.2026; 10 dni, sposoby dostarczenia) | snippet | https://budzet.krakow.pl/polecamy/309228,1910,komunikat,lista_poparcia.html |
| B12 | Instrukcja złożenia projektu w 13. edycji BO (zrzuty ekranu formularza) | snippet | https://budzet.krakow.pl/aktualnosci/311364,1909,komunikat,instrukcja_jak_zlozyc_projekt_w_13__edycji_budzetu_obywatelskiego_miasta_krakowa_.html |
| B13 | ABC BO: Jak zgłosić projekt (starsza wersja, dane do konta) | snippet | https://budzet.krakow.pl/strona_glowna/229146,artykul,jak_zglosic_projekt_-_abc_bo.html |
| B14 | Kraków: harmonogram BO 2025 (terminy, koszty projektów, kwoty puli) | snippet | https://www.krakow.pl/aktualnosci/290981,26,komunikat,budzet_obywatelski___oto_tegoroczny_harmonogram.html |
| B15 | Kraków: Nie zapomnij o liście poparcia (starszy komunikat, nieaktualne terminy) | snippet | http://krakow.pl/aktualnosci/208841,29,komunikat,budzet_obywatelski__nie_zapomnij_o_liscie_poparcia_.html |
| B16 | Uchwała Rady Miasta Krakowa nr XLV/926/26 z 21.01.2026 (regulamin BO, projekt wiodący, listy poparcia) | snippet | https://edziennik.malopolska.uw.gov.pl/WDU_K/2026/511/akt.pdf |
| B17 | Kraków: Aby budżet obywatelski służył wszystkim mieszkańcom (spór o „Piłkarskie Marzenia") | dr | https://krakow.pl/aktualnosci/300467,29,komunikat,aby_budzet_obywatelski_sluzyl_wszystkim_mieszkancom_krakowa.html |
| B18 | Kraków: nabór wniosków BO 2025 (warunki, ogólnodostępność) | snippet | https://www.krakow.pl/aktualnosci/291393,29,komunikat,budzet_obywatelski___startujemy_z_naborem_wnioskow.html |
| B19 | Kraków: ostatni dzień składania projektów 2025 | snippet | https://krakow.pl/aktualnosci/292208,29,komunikat,ostatni_dzwonek_na_skladanie_projektow_do_budzetu_obywatelskiego.html |

### K: Tło dodatkowe (niezweryfikowane)

| ID | Opis | Status | URL |
|---|---|---|---|
| K1 | NIK o domach pomocy społecznej (dotyczy DPS, nie OPS; tło o przeciążeniu pomocy społecznej) | dr | https://www.nik.gov.pl/aktualnosci/domy-pomocy-spolecznej.html |
| K2 | Doradca w Pomocy Społecznej: Bariery skutecznej pracy socjalnej | dr | https://doradcawpomocyspolecznej.pl/artykul/bariery-skutecznej-pracy-socjalnej |
| K3 | TransferHUB: inkubator innowacji społecznych (przykład istniejącego inkubatora) | snippet | https://transferhub.pl/o-transferhub/o-inkubatorze/ |
| K4 | POPOJUTRZE 2.0: inkubator innowacji w edukacji | snippet | https://popojutrze2.pl/ |
| K5 | Sieci Wsparcia: baza wiedzy | snippet | https://sieciwsparcia.pl/baza-wiedzy/ |
