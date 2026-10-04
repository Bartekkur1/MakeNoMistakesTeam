# Phase 3: Wynik, nagroda i przekazanie — Context

**Gathered:** 2026-10-04  
**Status:** Ready for planning  
**Workstream:** roblox  
**Phase:** 03-wynik-nagroda-i-przekazanie  
**Requirements:** SCR-01, SCR-02, SCR-03  

<domain>
## Phase Boundary

Faza 3 zamyka cykl misji edukacyjnej w Robloxie i integruje ją z panelem opiekuna (rodzica i szkoły):
1. **Punktacja (SCR-01):** Obliczenie wyniku na serwerze zgodnie z regułami `shared/MEASUREMENT.md` i `shared/CONTRACT.md`:
   - Działanie (0–2 pkt): bezpieczna odmowa (+2 pkt), uległość w symulacji hasła (0 pkt).
   - Quiz/wskazówki (0–1 pkt): rozpoznanie sygnałów za pierwszym razem (+1 pkt), za drugim razem (+0.5 pkt / uwzględnienie `hints_used: 1`).
   - Metryka `hints_used` (0, 1 lub 2).
2. **Nagroda kosmetyczna (SCR-02):**
   - Przyznanie graczowi jednej kosmetycznej nagrody 3D za ukończenie misji: Złota Tarcza Bezpieczeństwa Scamerino (`ScamerinoShieldAccessory`) nakładana na model postaci (Accessory do `BodyBackAttachment` / pleców lub piersi) ze złotym rozbłyskiem cząsteczkowym (`ParticleEmitter`).
   - Brak punktowania czy nagradzania rzeczywistych zgłoszeń; odznaka za ukończenie ćwiczenia.
3. **Eksport do skrzynki rodzica w panelu (SCR-03):**
   - Połączenie gry ze skrzynką odbiorczą panelu opiekuna (`web-app`) na dedykowany endpoint `POST /api/reports/ingest`.
   - **Model bezpieczeństwa M2M (Machine-to-Machine):** Serwer Robloxa autoryzuje się kluczem serwerowym `x-ingest-secret` (nigdy nie ujawnianym klientowi).
   - **Parowanie tożsamości (Parent-Child Pairing via Username):** Backend dopasowuje nick dziecka z gry (`roblox_username`, np. `Robloxianu5a9m1s7a` dla Oli) do konta rodzica (`Mama Oli (demo)`), automatycznie tworząc sprawę `Report` w stanie `pending_parent`.
   - Ekran końcowy w Robloxie prezentuje status wysyłki do rodzica, punktację, odznakę oraz podgląd raportu JSON z możliwością skopiowania.
   - Odporność na brak sieci / SSRF localhost: w przypadku braku tunelu/sieci pcall bezpiecznie przechodzi do trybu demonstracyjnego z podglądem JSON i informacją o gotowości do importu ręcznego.

</domain>

<decisions>
## Implementation Decisions

### Punktacja i pomiar (SCR-01)
- **D-30:** Punktacja wyliczana wyłącznie na serwerze w `MissionService.server.luau` na podstawie stanu sesji gracza (`stage`, `helpReceived`, `quizAttempts`, `selected_action`). Klient otrzymuje gotowy wynik, nie może sam zadeklarować punktów.
- **D-31:** Skala punktowa: 0–3 punkty:
  - 2 pkt za skuteczną odmowę scammerowi (`refusal_2_final` lub bezpieczna decyzja po karcie/pomocy).
  - 1 pkt za bezbłędny quiz pomocnika (0 podpowiedzi).
  - 0.5 pkt za quiz ukończony z podpowiedzią (`hints_used = 1`).
  - 0 pkt za uległość w symulacji (`share_fake_password`).
  - Pole `hints_used` przyjmuje wartość 0, 1 lub 2.

### Kosmetyczna nagroda 3D (SCR-02)
- **D-32:** Nagroda to obiekt `Accessory` („Złota Tarcza Scamerino”) przyczepiany do postaci gracza przez `Humanoid:AddAccessory`.
- **D-33:** Tarcza ma złoty kolor, emblemat ochronny i emituje subtelne złote iskry (`ParticleEmitter`).
- **D-34:** Wręczenie nagrody następuje po pomyślnym ukończeniu ćwiczenia (bezpieczna odmowa). Przy resecie gry (`resetForPlayer`) tarcza jest zdejmowana, aby umożliwić ponowne przejście.

### Skrzynka odbiorcza i eksport do backendu (SCR-03)
- **D-35:** Dedykowany endpoint skrzynki `POST /api/reports/ingest` z autoryzacją nagłówkiem `x-ingest-secret`. Gra nie loguje się na konto rodzica i nie zna jego haseł.
- **D-36:** Payload zawiera: `roblox_username` (`player.Name`), `roblox_user_id` (`player.UserId`), `attack_type: "data_request"`, `source: "game"`, `taken_actions` (`[]` lub `["entered_password"]`), `content`, `hints_used`, `score`, `outcome`.
- **D-37:** Odporność sieciowa: serwer wysyła zapytanie w `task.spawn` z `pcall`. W przypadku sukcesu HTTP (201 Created) klient wyświetla zielony status *„Wysłano na skrzynkę: Mama Oli (demo)”*. W przypadku braku łączności (np. brak tunelu dla localhost) klient wyświetla *„Zapisano w raporcie misji”* i umożliwia podejrzenie raportu JSON.

</decisions>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Klient Roblox → Serwer Roblox | Klient nie może manipulować punktacją ani wysyłać zapytań HTTP na zewnątrz. |
| Serwer Roblox → Backend Web-App | Serwer Roblox wysyła nagłówek `x-ingest-secret`, nie ma dostępu do kont użytkowników ani bazy. |
| Gracz → Tożsamość dziecka | Gracz identyfikowany przez `player.Name` / `UserId`; rodzic widzi nick powiązany w szkole. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-03-01 | Tampering | Punktacja misji | high | mitigate | Serwer autorytatywnie wylicza punkty i `hints_used` w `MissionService`. |
| T-03-02 | Information disclosure | Sekrety API | high | mitigate | Klucz `x-ingest-secret` przechowywany wyłącznie na serwerze Robloxa (`ServerScriptService`), nigdy w LocalScript. |
| T-03-03 | Denial of service | HttpService requests | medium | mitigate | Pojedyncze zapytanie per zakończenie misji z timeoutem i `pcall`, rate-limit po stronie serwera. |
| T-03-04 | Spoofing | Zgłoszenia ze skrzynki | medium | mitigate | Weryfikacja `x-ingest-secret` po stronie backendu i oznaczanie `source = "game"`. |
</threat_model>
