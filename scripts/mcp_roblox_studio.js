#!/usr/bin/env node
/**
 * Universal Cross-Platform Roblox Studio MCP Launcher (Node.js).
 * Dynamically discovers and executes StudioMCP on macOS, Windows, and Linux
 * without requiring any hardcoded paths.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

function findStudioMCP() {
  // 1. Environment variable override
  for (const envKey of ['ROBLOX_STUDIO_MCP_PATH', 'STUDIO_MCP_PATH']) {
    const custom = process.env[envKey];
    if (custom && fs.existsSync(custom)) {
      return path.resolve(custom);
    }
  }

  // 2. Check system PATH
  const isWin = process.platform === 'win32';
  try {
    const whichCmd = isWin ? 'where StudioMCP.exe' : 'which StudioMCP';
    const out = execSync(whichCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (out) {
      const candidate = out.split(/\r?\n/)[0].trim();
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch (_) {}

  // 3. macOS discovery
  if (process.platform === 'darwin') {
    const standardLocations = [
      '/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP',
      path.join(os.homedir(), 'Applications/RobloxStudio.app/Contents/MacOS/StudioMCP'),
      '/Applications/Roblox/RobloxStudio.app/Contents/MacOS/StudioMCP',
      path.join(os.homedir(), 'Applications/Roblox/RobloxStudio.app/Contents/MacOS/StudioMCP'),
    ];
    for (const loc of standardLocations) {
      if (fs.existsSync(loc)) return loc;
    }

    // Dynamic Spotlight search for RobloxStudio.app anywhere on macOS
    try {
      const out = execSync("mdfind \"kMDItemFSName == 'RobloxStudio.app'\"", {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      for (const line of out.split('\n')) {
        const appPath = line.trim();
        if (appPath) {
          const cand = path.join(appPath, 'Contents', 'MacOS', 'StudioMCP');
          if (fs.existsSync(cand)) return cand;
        }
      }
    } catch (_) {}
  }

  // 4. Windows discovery
  else if (isWin) {
    // Check Registry
    try {
      const regOut = execSync('reg query "HKCU\\Software\\Roblox\\RobloxStudio" /v ""', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const match = regOut.match(/REG_SZ\s+(.*)/i);
      if (match && match[1]) {
        const dir = match[1].trim();
        const cand = path.join(dir, 'StudioMCP.exe');
        if (fs.existsSync(cand)) return cand;
      }
    } catch (_) {}

    // Check version folders in AppData & ProgramFiles
    const bases = [
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Roblox', 'Versions') : null,
      process.env.APPDATA ? path.join(process.env.APPDATA, 'Roblox', 'Versions') : null,
      process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Roblox', 'Versions') : null,
      process.env['PROGRAMFILES(X86)'] ? path.join(process.env['PROGRAMFILES(X86)'], 'Roblox', 'Versions') : null,
      'C:\\Roblox\\Versions',
      'D:\\Roblox\\Versions',
    ].filter(Boolean);

    for (const base of bases) {
      if (fs.existsSync(base)) {
        try {
          const subdirs = fs.readdirSync(base)
            .filter(d => d.startsWith('version-'))
            .map(d => path.join(base, d))
            .filter(d => {
              try { return fs.statSync(d).isDirectory(); } catch (_) { return false; }
            });

          // Sort by mtime descending (newest version first)
          subdirs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

          for (const verDir of subdirs) {
            const cand = path.join(verDir, 'StudioMCP.exe');
            if (fs.existsSync(cand)) return cand;
          }
        } catch (_) {}
      }
    }
  }

  // 5. Linux (Vinegar / Wine)
  else if (process.platform === 'linux') {
    const home = os.homedir();
    const linuxDirs = [
      path.join(home, '.var/app/org.vinegarhq.Vinegar/data/prefixes'),
      path.join(home, '.wine/drive_c'),
      path.join(home, '.local/share/grapejuice/prefixes'),
    ];
    for (const root of linuxDirs) {
      if (fs.existsSync(root)) {
        try {
          const out = execSync(`find "${root}" -name "StudioMCP.exe" 2>/dev/null`, {
            encoding: 'utf8',
          }).trim();
          if (out) {
            const first = out.split('\n')[0].trim();
            if (first && fs.existsSync(first)) return first;
          }
        } catch (_) {}
      }
    }
  }

  return null;
}

const binary = findStudioMCP();

if (!binary) {
  process.stderr.write(
    '[roblox-studio-mcp] ERROR: Roblox StudioMCP binary could not be found.\n' +
    'Please ensure Roblox Studio is installed, or set ROBLOX_STUDIO_MCP_PATH:\n' +
    '  export ROBLOX_STUDIO_MCP_PATH=/path/to/StudioMCP\n' +
    '  (Windows: set ROBLOX_STUDIO_MCP_PATH=C:\\path\\to\\StudioMCP.exe)\n'
  );
  process.exit(1);
}

const child = spawn(binary, process.argv.slice(2), {
  stdio: 'inherit',
});

child.on('error', (err) => {
  process.stderr.write(`[roblox-studio-mcp] Failed to spawn ${binary}: ${err.message}\n`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code || 0);
  }
});
