# HANDOFF: dokończenie researchu (dla nowej sesji Claude Code z Claude in Chrome)

> **ZAKOŃCZONE 2026-10-03.** Wszystkie zadania wykonane; wyniki w `ideas/defence/research.md`. Plik zostaje tylko jako historia.

**Jak wznowić:** w nowej sesji (`claude --chrome`) wklej:
> Przeczytaj `MakeNoMistakesTeam/defence/HANDOFF-research.md` i dokończ research zgodnie z nim.

## Kontekst
- Projekt: HackYeah 2026, ścieżka Defence. Koncepcja: `defence/koncepcja.md` (cyberpomocnik-awatar, misja Roblox, rozszerzenie przeglądarki, strona do wklejania treści, panel opiekuna, test przed i po treningu).
- Cel: research do pitchu, potem prezentacja w sli.dev (`slides/`).
- Uzgodnione decyzje: **wiek 9–13** (poprawione w koncepcji), zakres **Roblox oraz Discord/SMS/mail**, dodatkowo: konkurencja PL, rynek i model, skuteczność treningu u dzieci, prawo (AI i dane).
- Pełny plan: `C:\Users\zaras\.claude\plans\jestem-na-hackatonie-w-merry-horizon.md` (kroki A1–A4, B5–B13).
- Wynik zbiorczy: `ideas/defence/research.md`. Ma strukturę, oznaczenia pewności (✅/🟡/🌍) i bibliografię. **Dopisuj do niego, nie twórz nowego pliku.**
- Zasady: przy każdej liczbie podajemy źródło, rok, kraj i próbę; najpierw źródła PL; niczego nie zmyślamy, brak danych oznaczamy „BRAK” i proponujemy proxy. Scenki demo uczą rozpoznawania, a nie wykonania oszustwa.

## Co zrobione
- A1–A4 częściowo (zob. `research.md`). Zebrane źródła: Mediapanel, Roblox Q1 2026, CERT Polska 2025, CERT Orange (Roblox), Kaspersky, Dyżurnet 2025, Internet dzieci 2025, Lastdrager 2017, Be Internet Awesome RCT, oba PDF-y z `defence/`.

## Zadania dla Claude in Chrome (WebSearch/WebFetch sobie nie poradziły)
1. **NASK „Nastolatki” 2025, PDF** (https://www.nask.pl/media/2025/09/Nastolatki_RAPORT-2.pdf): potwierdzić 57% vs 21% (nadzór) i 58% vs 18%; znaleźć dane o grach, oszustwach, podawaniu danych, mówieniu rodzicom, kontakcie z obcymi. Sprawdzić, czy próba obejmuje młodsze klasy.
2. **Ofcom Children's media use 2025**, dane interaktywne: odsetek dzieci 8–11 grających w Roblox oraz doświadczenia z oszustwami i obcymi.
3. **BBB**: potwierdzić „+67% skarg na Roblox w 2025, średni wiek ofiary 11 lat” u źródła (bbb.org) albo usunąć.
4. **NordVPN 2026 Consumer Cybersecurity Report**: potwierdzić „Roblox druga marka w phishingu, 12,32%” albo usunąć.
5. **Sieciaki.pl (NASK)**: czy działa w 2026, dla jakiego wieku, forma (gra, lekcje), zasięg; czy porusza Robloxa i phishing w grach.
6. **Interland / Be Internet Awesome w PL**: polska wersja, wiek, moduł o phishingu („Reality River”).
7. **Roblox Transparency Report / Safety Center**: liczby zgłoszeń, przejęć kont, scamów; kontrola rodzicielska (parent accounts) i jej wykorzystanie; zasady dla gier edukacyjnych (linki zewnętrzne, wymagania publikacji, wiek twórcy).
8. **UOKiK, Rzecznik Finansowy, policja.pl**: dane PL o nieautoryzowanych płatnościach dzieci w grach i oszustwach wobec małoletnich.

## Zadania, które można robić WebSearchem
- **B8 Discord/SMS/mail:** phishing wobec dzieci; przejście „z Robloxa na Discorda” (CERT, NASK, ESET, Bitdefender, raporty Discorda o bezpieczeństwie).
- **B9:** Anti-Phishing Phil (Sheng 2007), What.Hack (Wen 2019), meta-analizy grywalizacji w edukacji cyberbezpieczeństwa dzieci; wnioski z PDF-ów są już w `research.md`.
- **B10 Prawo:** ustawa „Kamilka” (standardy ochrony małoletnich, obowiązek szkół od 15.02.2024 / 2024–2025), RODO art. 8 + art. 1 ustawy o ochronie danych (zgoda rodzica do 16 lat w PL), AI Act art. 50 (przejrzystość chatbotów) i art. 5 (zakaz wykorzystywania podatności ze względu na wiek), DSA art. 28 (ochrona małoletnich), ustawa o ochronie małoletnich przed szkodliwymi treściami (weryfikacja wieku, 2025/2026). Numery: 116 111 (telefon zaufania), 800 100 100 (dla rodziców i nauczycieli), incydent.cert.pl / SMS 8080, dyzurnet.pl. Pomocny może być MCP `polish-law` (search_legislation).
- **B11 Konkurencja:** tabela: Sieciaki, Interland, FDDS (Akademia, 116 111), Fundacja Orange („Mega Misja”), T-Mobile „Pewni w sieci”, CGI „Spoofy”, Cyberlekcje 3.0 (MC + NASK, 29 scenariuszy), materiały Robloxa. Kolumny: wiek, forma, PL?, Roblox?, pomoc w realnej sytuacji?, panel opiekuna?, pomiar skuteczności?
- **B12 Rynek:** GUS/SIO: liczba szkół podstawowych i uczniów klas 3–7 w PL; finansowanie: Cyberbezpieczny Samorząd, granty NASK, MC/MEN, Fundusz Sprawiedliwości (?), CSR banków i telekomów.
- **B13 Scenki demo:** 4–5 fikcyjnych dialogów (darmowe Robuxy, „admin” prosi o kod 2SV, wymiana „ty pierwszy”, „przejdźmy na Discorda”, „darmowy render GFX” i plik HAR) plus 1–2 uczciwe oferty (oficjalny event Robloxa, prawdziwy kolega). Dla każdej: sygnały ostrzegawcze i właściwa reakcja.

## Na koniec
1. Uzupełnić „Kluczowe liczby na pitch” (5–7, tylko ✅) i sekcję „Otwarte pytania / do walidacji z nauczycielem”.
2. Usunąć z `research.md` nagłówek „SZKIC W TOKU” i usunąć ten plik HANDOFF (albo zostawić z dopiskiem „zakończone”).
3. Commit i push do `master` w repo MakeNoMistakesTeam (użytkownik ma dostęp do zapisu), potem wyjaśnić po polsku, co zrobiono (użytkownik nie zna gita).
