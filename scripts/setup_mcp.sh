#!/usr/bin/env bash
# One-click universal MCP setup script for team members (macOS / Linux)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$HOME/.local/bin"

echo "============================================================"
echo "  MakeNoMistakesTeam - Universal MCP Setup (Bash)"
echo "============================================================"

# 1. Test Roblox Studio discovery
if "$SCRIPT_DIR/mcp_roblox_studio.sh" --version >/dev/null 2>&1; then
  echo "[OK] Roblox StudioMCP detected successfully."
else
  echo "[WARNING] Roblox StudioMCP could not be detected automatically."
  echo "          Ensure Roblox Studio is installed or set ROBLOX_STUDIO_MCP_PATH."
fi

# 2. Install global 'roblox-studio-mcp' CLI command into ~/.local/bin
mkdir -p "$BIN_DIR"
ln -sf "$SCRIPT_DIR/mcp_roblox_studio.sh" "$BIN_DIR/roblox-studio-mcp"
chmod +x "$BIN_DIR/roblox-studio-mcp"
chmod +x "$SCRIPT_DIR/mcp_roblox_studio.sh"
chmod +x "$SCRIPT_DIR/mcp_roblox_studio.js"
echo "[OK] Installed CLI symlink: $BIN_DIR/roblox-studio-mcp"

# 3. Configure Claude Desktop if present
CLAUDE_CONFIG=""
if [ "$(uname)" = "Darwin" ]; then
  CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [ -n "$APPDATA" ]; then
  CLAUDE_CONFIG="$APPDATA/Claude/claude_desktop_config.json"
else
  CLAUDE_CONFIG="$HOME/.config/Claude/claude_desktop_config.json"
fi

if [ -n "$CLAUDE_CONFIG" ]; then
  mkdir -p "$(dirname "$CLAUDE_CONFIG")"
  cp "$SCRIPT_DIR/../mcp/claude_desktop_config.example.json" "$CLAUDE_CONFIG"
  echo "[OK] Configured Claude Desktop: $CLAUDE_CONFIG"
fi

# 4. Check Node.js
if command -v node >/dev/null 2>&1; then
  echo "[OK] Node.js is installed ($(node --version))."
else
  echo "[WARNING] Node.js not found in PATH."
fi

# 5. Check uv
if command -v uv >/dev/null 2>&1 || command -v uvx >/dev/null 2>&1; then
  echo "[OK] uv / uvx is installed."
else
  echo "[WARNING] uv was not found. Install it for Blender & QGIS MCP servers:"
  echo "          curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

echo ""
echo "[SUCCESS] Setup complete! You can now use Roblox Studio MCP in Cursor, VS Code, Claude, and Codex."
