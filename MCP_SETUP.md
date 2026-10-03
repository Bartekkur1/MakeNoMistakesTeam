# Uniwersalna konfiguracja MCP (Model Context Protocol) dla zespołu i agentów AI

Repozytorium zawiera w pełni **uniwersalną, międzyplatformową konfigurację MCP** opartą o skrypty **Node.js oraz Bash**. Działa bezpośrednio na systemach **macOS, Windows i Linux** bez żadnych zakodowanych na stałe ścieżek (`/Applications`, katalogów domowych, itp.).

---

## 🛠️ Dostępne serwery MCP

| Serwer | Przeznaczenie | Typ | Komenda uruchomieniowa |
| :--- | :--- | :--- | :--- |
| **`roblox-studio`** | Scena, skrypty, testy w Roblox Studio | Stdio | `node scripts/mcp_roblox_studio.js` (lub Bash: `./scripts/mcp_roblox_studio.sh`) |
| **`blender`** | Generowanie modeli 3D, materiały w Blenderze | Stdio | `uvx mcp-for-blender` (port 9878) |
| **`qgis`** | Warstwy GIS, analiza danych przestrzennych | Stdio | `uvx --from https://github.com/nkarasiak/qgis-mcp/archive/refs/heads/main.zip qgis-mcp-server` |
| **`unreal-mcp`** | Integracja z silnikiem Unreal Engine | HTTP / SSE | `http://127.0.0.1:8000/mcp` |

---

## ⚡ Wymagania wstępne

1. **Node.js** (do uniwersalnego uruchamiania launchera Roblox Studio na dowolnym OS).
2. **`uv`** (dla serwerów Blender i QGIS):
   * **macOS / Linux**: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   * **Windows**: `winget install --id=astral-sh.uv` lub `irm https://astral.sh/uv/install.ps1 | iex`

---

## 🎮 Roblox Studio – Uniwersalny mechanizm detekcji

Roblox Studio zawiera wbudowany proces proxy `StudioMCP`.
W repozytorium przygotowano dwa warianty skryptu:
- **Node.js (międzyplatformowy)**: [`scripts/mcp_roblox_studio.js`](scripts/mcp_roblox_studio.js)
- **Bash (macOS / Linux / WSL / Git Bash)**: [`scripts/mcp_roblox_studio.sh`](scripts/mcp_roblox_studio.sh)

### Jak działa dynamiczna detekcja:
1. **Zmienna środowiskowa (opcjonalny override)**:
   `ROBLOX_STUDIO_MCP_PATH` lub `STUDIO_MCP_PATH`.
2. **System PATH**:
   Sprawdza obecność `StudioMCP` / `StudioMCP.exe` w `PATH`.
3. **macOS**:
   * Przeszukanie indeksu Spotlight (`mdfind`) dla aplikacji `RobloxStudio.app` i pliku `StudioMCP` w dowolnym katalogu na dysku.
   * Standardowe lokalizacje (`/Applications`, `~/Applications`).
4. **Windows**:
   * Odczyt rejestru (`HKCU\Software\Roblox\RobloxStudio` oraz powiązania protokołu `roblox-studio`).
   * Skanowanie katalogu `%LOCALAPPDATA%\Roblox\Versions\version-*\StudioMCP.exe` (automatycznie wybiera najnowszą wersję).
   * Sprawdzenie `%PROGRAMFILES%` oraz partycji `C:` i `D:`.
5. **Linux / Wine / Vinegar**:
   * Skanowanie prefiksów Wine oraz Flatpak (`org.vinegarhq.Vinegar`).

---

## 🚀 Szybki start (Konfiguracja 1 kliknięciem)

Na macOS / Linux / Git Bash uruchom:
```bash
./scripts/setup_mcp.sh
```

Skrypt:
1. Sprawdzi dostępność `StudioMCP` w Twoim systemie.
2. Zainstaluje globalny symlink `roblox-studio-mcp` w `~/.local/bin`.
3. Automatycznie zaktualizuje plik konfiguracyjny Claude Desktop (`claude_desktop_config.json`).
4. Zweryfikuje instalację Node.js oraz `uv`.

---

## 💻 Integracja z edytorami i agentami AI

### 1. Cursor
W repozytorium znajduje się plik [`.cursor/mcp.json`](.cursor/mcp.json).
Po otwarciu repozytorium w Cursorze serwery MCP są aktywne od razu.

### 2. VS Code / Cline / Roo Code
Plik [`.vscode/mcp.json`](.vscode/mcp.json) definiuje serwery z użyciem zmiennej `${workspaceFolder}` – działa od razu na każdej maszynie.

### 3. Claude Code (CLI)
Claude Code automatycznie odczytuje konfigurację z pliku [`.mcp.json`](.mcp.json) w głównym katalogu repozytorium.

### 4. OpenAI Codex CLI
Konfiguracja MCP znajduje się w pliku [`.codex/config.toml`](.codex/config.toml).

### 5. Claude Desktop
Skopiuj wzorzec [`mcp/claude_desktop_config.example.json`](mcp/claude_desktop_config.example.json) do:
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
(lub uruchom `./scripts/setup_mcp.sh`, który zrobi to automatycznie).

---

## 🧪 Weryfikacja działania

1. **Uruchom Roblox Studio** i otwórz projekt (Place).
2. Sprawdź działanie launchera w terminalu:
   ```bash
   node scripts/mcp_roblox_studio.js --version
   # lub:
   ./scripts/mcp_roblox_studio.sh --version
   # Oczekiwany wynik: StudioMCP 1.0.0 (...)
   ```
3. W swoim agencie (Cursor, Claude, Codex) wpisz:
   > *"Wylistuj otwarte instancje studia Roblox za pomocą narzędzia MCP list_roblox_studios"*
