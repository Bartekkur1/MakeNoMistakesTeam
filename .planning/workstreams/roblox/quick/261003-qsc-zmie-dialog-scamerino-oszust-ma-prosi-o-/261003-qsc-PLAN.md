# Quick Plan: prośba o hasło w dialogu Scamerino

## Cel

Zaktualizować scenariusz misji tak, by oszust obiecywał darmowe Robuxy w zamian za hasło do konta, a Scamerino uczył rozpoznawania tej czerwonej flagi. Wybory pozostają fikcyjne: gra nie przyjmuje tekstu ani prawdziwych danych logowania.

## Zakres

1. W `roblox/src/shared/MissionContent.luau` zmienić tekst oferty i złego zakończenia na prośbę o hasło, dopasować etykietę przycisku do fikcyjnego hasła i zmienić identyfikator wyboru na `share_fake_password`. Zachować w dobrym zakończeniu przypomnienie o niepodawaniu haseł, tokenów i kodów SMS oraz ostrzeżenie, że Roblox nie prosi o kody zabezpieczające.
2. W `roblox/src/client/ScamerinoDialogueController.client.luau` dopasować wyjaśnienie phishingu, czerwone flagi i poradę dla gracza do prośby o hasło w zamian za Robuxy; utrzymać ogólne ostrzeżenia o kodach SMS.
3. Sprawdzić, że `roblox/src/client/MissionController.client.luau` nadal wysyła wyłącznie identyfikator przycisku, a `roblox/src/server/MissionService.server.luau` rozstrzyga wybór przez `MissionContent.getChoice`, bez pola tekstowego ani payloadu hasła. Nie zmieniać obsługi GUI/serwera, jeśli ten kontrakt pozostaje prawdziwy.

## Weryfikacja

- `cd roblox && selene src && stylua --check src && rojo build default.project.json -o /tmp/roblox-password-dialog.rbxlx`
- `rg -n 'share_fake_password|fikcyjne hasło|hasła|kodów SMS' roblox/src/shared/MissionContent.luau roblox/src/client/ScamerinoDialogueController.client.luau`
- Ręcznie potwierdzić w Roblox Studio: wybór odmowy prowadzi do dobrego zakończenia, fikcyjny wybór hasła do złego, a interfejs nie pozwala wpisać ani wysłać żadnych danych. Repo nie ma automatycznego runnera testów Luau; lint, format, build Rojo i Play w Studio są dostępnymi kontrolami.

## Kryterium ukończenia

Oferta mówi o haśle do konta w zamian za darmowe Robuxy; ostrzeżenia edukacyjne obejmują hasła i kody SMS; wybór nadal przekazuje tylko stały identyfikator, nigdy treść hasła.
