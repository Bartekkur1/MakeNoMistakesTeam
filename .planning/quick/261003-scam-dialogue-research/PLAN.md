---
id: 261003-scam-dialogue-research
slug: scam-dialogue-research
description: Realistyczny dialog ze scammerem na bazie research.md bez sugerowania rozwiazania
created: 2026-10-03
status: in-progress
---

# Quick Plan: Realistyczny dialog ze scammerem oparty na research.md

## Problem
Dotychczasowy dialog ze scammerem:
1. Zawierał sztuczne wtrącenia („Link jest tu pokazany jako tekst do ćwiczenia...”, „Podejrzana Oferta”), które psuły immersję i od razu zdradzały, że postać jest oszustem.
2. Przyciski wyboru sugerowały rozwiązanie: jeden był zielony z morałem („Nie podaję kodu; sprawdzę ofertę z dorosłym”), a drugi czerwony („Podaję kod...”). Gracz nie musiał myśleć krytycznie.
3. Wcześniejsza wersja odnosiła się do kodów SMS, podczas gdy według `ideas/defence/research.md` (sekcja A3 i B13) oraz wytycznych użytkownika najczęstszym zagrożeniem w Robloxie dla dzieci 9–13 lat jest socjotechniczne wyłudzanie danych konta/hasła pod pretekstem doładowania Robuxów („muszę się zalogować, żeby ci doładować”).

## Cel
1. Opracować wiarygodny dialog NPC „MatiBuilds” symulujący realną próbę przejęcia konta w Robloxie:
   - Nawiązanie relacji (komplement avatara, wspólna gra),
   - Obietnica Robuxów z rzekomej puli grupy/karty podarunkowej,
   - Pretekst techniczny („muszę się zalogować, żeby zatwierdzić wypłatę”),
   - Usypianie czujności („zaraz zmienisz hasło, ja tylko zatwierdzę transfer”) i presja czasu.
2. Zaprojektować opcje wyboru tak, aby nie sugerowały rozwiązania:
   - Opcje w języku gracza w wieku 9–13 lat,
   - Brak dydaktycznego morału w treści przycisków,
   - Neutralna kolorystyka przycisków wyboru (brak czerwony/zielony przed dokonaniem wyboru).
3. Zaktualizować `roblox/src/shared/MissionContent.luau`, `roblox/src/client/MissionController.client.luau` oraz `roblox/src/server/ScammerNPCManager.server.luau`.
4. Zaktualizować `ReplicatedStorage.MissionContent` w trybie Edit Roblox Studio.
5. Zweryfikować linterem, formaterem i buildem Rojo oraz testem w Roblox Studio.
