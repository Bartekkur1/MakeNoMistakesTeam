# Shared — wspólne artefakty workstreamów

Jedno źródło prawdy dla wszystkich torów. Workstreamy (`web-app`, `widget`, `roblox`, `presentation`) tu **czytają**; edytuje tylko właściciel.

| Plik | Właściciel | Zawartość | Czytają |
|------|-----------|-----------|---------|
| `CONTRACT.md` | osoba 3 (web-app) | Kontrakt integracji: obiekty, pola, endpointy | wszystkie |
| `MEASUREMENT.md` | osoba 4 (presentation) | Definicje pomiaru, punktacja, zasady nagród | web-app, roblox |
| `content/` | osoba 4 (presentation) | Dialogi misji, pytania pomocnika, sygnały, wyjaśnienia, zestawy A/B, klucz oceny | wszystkie |
| `examples/` | osoba 3 (web-app) | Przykładowe żądania i odpowiedzi API (JSON) zgodne z CONTRACT.md | wszystkie |

## Zasady rozdzielenia

- Każdy workstream pracuje wyłącznie w `.planning/workstreams/<nazwa>/` i w swoim katalogu kodu (`web-app/`, `widget/`, `roblox/`, `presentation/`).
- Zmiana w `shared/` przez nie-właściciela: najpierw prośba do właściciela, potem commit właściciela.
- Zmiana kontraktu = osobny commit `docs(shared): ...` i wzmianka w STATE.md każdego dotkniętego workstreamu.
- Praca w workstreamie: `/gsd-workstreams switch <nazwa>` albo flaga `--ws <nazwa>` przy każdej komendzie GSD.
