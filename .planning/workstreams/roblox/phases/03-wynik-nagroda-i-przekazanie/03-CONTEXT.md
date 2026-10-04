# Phase 3: Wynik, nagroda i przekazanie — Context

**Gathered:** 2026-10-04
**Status:** Ready for replanning; wykonanie nie rozpoczęło się.
**Requirements:** SCR-01, SCR-02, SCR-03

<domain>
## Phase Boundary

Faza kończy każdą ukończoną próbę jakościowym wynikiem bez punktów, automatycznie przekazuje oznaczone jako ćwiczenie zgłoszenie do opiekuna i przyznaje jedną sesyjną nagrodę 3D za końcową bezpieczną odmowę. Nie obejmuje transkryptu, metryk quizu lub sprawdzenia oferty w raporcie, podglądu JSON, kolejki offline, trwałej nagrody, panelu nauczyciela ani odbioru mobilnego.
</domain>

<decisions>
## Implementation Decisions

- **D-30:** Końcowa bezpieczna odmowa daje `status = "passed"`, także po pomocy, błędach quizu lub wcześniejszej nieudanej próbie. Fikcyjne przekazanie hasła daje `status = "failed"`. Bez punktów.
- **D-31:** Raport zawiera tylko decyzję końcową i informację o użyciu pomocy. Pomija transkrypt, próby quizu, sprawdzenie oferty i punkty.
- **D-32:** Ta sama nagroda przysługuje za odmowę samodzielną, po pomocy i po ponownej próbie. Jest to `Accessory` na plecach przez `BodyBackAttachment`, bez duplikatów.
- **D-33:** Tarcza ma kolory Scamerino i złotą obwódkę. Dwusekundowy złoty rozbłysk występuje tylko przy pierwszym zdobyciu w sesji.
- **D-34:** Nagroda pozostaje do końca sesji, replay jej nie usuwa, respawn przywraca, a późniejszy błąd jej nie odbiera. Bez zapisu między sesjami.
- **D-35:** Payload używa `source="game"`, `attack_type="data_request"`, `outcome="safe_refusal"|"compromised_password"`, `taken_actions=[]`, `hints_used=0|1` jako dokładnego odwzorowania `helpReceived`, i pomija `score`. Treść jawnie nazywa zdarzenie ćwiczeniem; backend nie wyprowadza z wyniku rzeczywistego `entered_password`.
- **D-36:** Serwer Roblox wysyła `POST /api/reports/ingest` z `x-ingest-secret`. Sekret pozostaje tylko po stronie serwera, bez wartości w kodzie/dokumentacji i bez replikacji do klienta. Nick/UserId pochodzą z `Player`.
- **D-37:** Maksymalnie trzy próby wysyłki w tle (0, 1, 3 s) dla transportu/5xx. Po wyczerpaniu: „Nie udało się wysłać do opiekuna”. Bez kolejki, podglądu offline i deklaracji zapisu.
- **D-38:** Mała karta podsumowania obok czatu; mapa widoczna, replay dostępny od razu.
- **D-39:** Po odmowie dokładnie: „Dobra decyzja! Twoje hasło zostaje u Ciebie” oraz informacja o tarczy; kolejne zaliczenie nie sugeruje drugiej tarczy.
- **D-40:** Po błędzie dokładnie: „To było ćwiczenie. Hasło daje dostęp do konta — spróbuj jeszcze raz”, bez sugestii prawdziwego wycieku lub zmiany rzeczywistego hasła.
- **D-41:** Karta pokazuje wyłącznie status wysyłki, bez raportu, JSON-a, kopiowania i danych technicznych.
- **D-42:** Automatyczna wysyłka po każdej zakończonej próbie bezpiecznej i błędnej. Przerwanie rozmowy nie tworzy raportu.
- **D-43:** Powiązany nick trafia do przypisanego opiekuna. Niepowiązany używa istniejącego fallbacku „Mama Oli (demo)” jawnie oznaczonego jako profil demo. Adresat i `matched` pochodzą z API.
- **D-44:** Najpierw „Wysyłanie do opiekuna…”, potem potwierdzenie odbioru API albo błąd. Potwierdzenie nie oznacza odczytania.
- **D-45:** Replay działa podczas wysyłki. Stare żądanie kończy się w tle, ale nie nadpisuje stanu nowej próby.

### Rozstrzygnięcia techniczne

- Serwer generuje UUID `attempt_id` raz przy zakończeniu próby. Retry używa identycznego klucza i payloadu; nowe zakończenie dostaje nowy UUID.
- Backend atomowo zapisuje próbę, raport i niezmienne potwierdzenie. Duplikat/równoległy retry zwraca to samo `report_id`, adresata i `matched`; ten sam klucz z innym payloadem daje 409.
- Roblox czyta `BackendBaseUrl` i `IngestSecret` z `ServerStorage.ReportExportSettings`. URL musi być HTTPS; brak fallbacku localhost.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`, `.planning/workstreams/roblox/{ROADMAP,REQUIREMENTS}.md`
- `.planning/workstreams/roblox/phases/02-wybory-konsekwencje-i-pomocnik/02-CONTEXT.md`
- `.planning/shared/{CONTRACT,MEASUREMENT}.md`
- `assets/scamerino_palette.json`, `assets/Scamerino_Alertinio.png`
- `roblox/src/{server/MissionService.server,shared/MissionContent,client/MissionController.client}.luau`, `roblox/sync.project.json`
- `projects/web-app/src/app/api/reports/ingest/route.ts`, `projects/web-app/src/lib/server/{validate,roblox}.ts`, `projects/web-app/src/lib/contract/types.ts`, `projects/web-app/tests/api/roblox.test.ts`, `projects/web-app/supabase/migrations/`

Źródła web-app odczytano początkowo z `origin/master` (commit wskazany w `03-PATTERNS.md`); podczas ponownej kontroli są już obecne w working tree. Przed implementacją sprawdzić dostępność i zgodność z aktualnym masterem, uzgadniając zmiany tylko w razie potrzeby i bez nadpisywania lokalnej pracy.
</canonical_refs>

<code_context>
## Existing Code Insights

- Terminalne przejścia to `ending_good` i `ending_bad`; eksport podpina się tylko tam. `revision` i `sequence` chronią klienta przed starymi callbackami.
- Ingest przyjmuje `outcome`, nie `test_outcome`; obecna walidacja dopisuje `entered_password` i musi przestać to robić dla ćwiczenia.
- Obecny ingest nie deduplikuje. Nowa migracja musi dodać transakcyjną funkcję z unikalnym `attempt_id`.
- Migrację stosuje człowiek zgodnie z zasadami web-app. Żywy test zatrzymuje się, dopóki kod nie jest wdrożony, migracja zastosowana, HTTPS działa, a ServerStorage i HTTP Requests są skonfigurowane.
</code_context>

<deferred>
## Deferred Ideas

Trwała nagroda, kolejka offline, podgląd raportu/JSON, panel nauczyciela i test telefonu.
</deferred>

---
*Context consolidated: 2026-10-04*
