#!/usr/bin/env bash
# Universal Bash launcher for Roblox Studio MCP (macOS / Linux / WSL / Git Bash)

find_studio_mcp() {
  # 1. Environment variable override
  if [ -n "$ROBLOX_STUDIO_MCP_PATH" ] && [ -f "$ROBLOX_STUDIO_MCP_PATH" ]; then
    echo "$ROBLOX_STUDIO_MCP_PATH"
    return 0
  fi
  if [ -n "$STUDIO_MCP_PATH" ] && [ -f "$STUDIO_MCP_PATH" ]; then
    echo "$STUDIO_MCP_PATH"
    return 0
  fi

  # 2. Check system PATH
  if command -v StudioMCP >/dev/null 2>&1; then
    command -v StudioMCP
    return 0
  fi
  if command -v StudioMCP.exe >/dev/null 2>&1; then
    command -v StudioMCP.exe
    return 0
  fi

  # 3. macOS
  if [ "$(uname)" = "Darwin" ]; then
    for cand in \
      "/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP" \
      "$HOME/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP" \
      "/Applications/Roblox/RobloxStudio.app/Contents/MacOS/StudioMCP" \
      "$HOME/Applications/Roblox/RobloxStudio.app/Contents/MacOS/StudioMCP"; do
      if [ -x "$cand" ]; then
        echo "$cand"
        return 0
      fi
    done

    # Spotlight search
    if command -v mdfind >/dev/null 2>&1; then
      for app in $(mdfind "kMDItemFSName == 'RobloxStudio.app'" 2>/dev/null); do
        cand="$app/Contents/MacOS/StudioMCP"
        if [ -x "$cand" ]; then
          echo "$cand"
          return 0
        fi
      done
    fi
  fi

  # 4. Windows / Git Bash / WSL
  if [ -n "$LOCALAPPDATA" ]; then
    for cand in "$LOCALAPPDATA"/Roblox/Versions/version-*/StudioMCP.exe; do
      if [ -f "$cand" ]; then
        echo "$cand"
        return 0
      fi
    done
  fi

  return 1
}

BINARY=$(find_studio_mcp)

if [ -z "$BINARY" ]; then
  echo >&2 "[roblox-studio-mcp] ERROR: StudioMCP binary not found."
  echo >&2 "Please install Roblox Studio or set ROBLOX_STUDIO_MCP_PATH."
  exit 1
fi

exec "$BINARY" "$@"
