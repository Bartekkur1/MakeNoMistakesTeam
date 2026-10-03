# Phase 1: Rozszerzenie i przekazanie treści - Pattern Map

**Mapped:** 2026-10-03
**Files analyzed:** 22 (all new, under `projects/widget/`)
**Analogs found:** 0 code analogs / 22. There are 2 tracked asset sources to consume.

The repo has no JS/TS source code. `projects/api-ui/`, `projects/roblox/` and `projects/presentation/` hold no tracked code. All code patterns come from RESEARCH.md ("Recommended Project Structure", Patterns 1-4, "Validation" spy/scan tests).

## File Classification

| New File | Role | Data Flow | Analog / Source | Match |
|---|---|---|---|---|
| `projects/widget/package.json`, `build.mjs`, `vitest.config.mjs`, `playwright.config.mjs`, `.gitignore` | config/build | batch | none (RESEARCH Standard Stack) | none |
| `projects/widget/manifest.json` | config | n/a | RESEARCH manifest example (~line 217); icons from `assets/widget-avatar/` | partial |
| `projects/widget/src/content/main.js` | bootstrap | event-driven | none (RESEARCH Pattern 1) | none |
| `projects/widget/src/content/host.js` | component | n/a | none (RESEARCH Shadow DOM pattern) | none |
| `projects/widget/src/content/avatar.js` | component | event-driven | none; image `assets/widget-avatar/avatar-*.png` | partial |
| `projects/widget/src/content/capture.js` | utility | request-response | none (sole `getSelection` site) | none |
| `projects/widget/src/ui/panel.js` | component | event-driven | none | none |
| `projects/widget/src/ui/strings.pl.js` | config | n/a | none | none |
| `projects/widget/src/ui/widget.css` | style | n/a | `assets/scamerino_palette.css` | token source |
| `projects/widget/src/core/draft.js`, `case.js` | model/service | transform | none | none |
| `projects/widget/src/core/integration.js` | service | request-response | none (sole `chrome.runtime.sendMessage` site) | none |
| `projects/widget/src/background/sw.js` | service worker | event-driven | none | none |
| `projects/widget/tests/unit/*.test.js`, `tests/e2e/*` | test | n/a | none (RESEARCH Validation section ~line 502) | none |

## Pattern Assignments

### `projects/widget/src/ui/widget.css`
**Source:** `assets/scamerino_palette.css` lines 7-39 (tokens on `:root`).
Shadow trees never match `:root`, and the `rem` units follow the host page's font size (RESEARCH pitfall, ~line 418). Import the palette as text in the build and then do one of the following:
- re-declare the tokens on `:host`, or
- rewrite `:root` to `:host` at build time, and swap `--radius-widget: 1.25rem` for `20px`.

Key tokens:
```css
--color-shark-blue: #0F62DB;  --color-siren-amber: #FF8A00;
--color-hook-crimson: #EA3323; --color-surface-card: #FFFFFF;
--color-text-primary: #0F172A; --shadow-shield-card: ...;
--radius-widget: 1.25rem; /* 20px -> use px inside shadow */
```

### `projects/widget/manifest.json` + `build.mjs` (icon copy)
**Source:** `assets/widget-avatar/` (tracked): `icon-16/32/48/128.png` go to the manifest `icons` and `action.default_icon`. `avatar-48/64/128.png` are for the floating avatar (see `assets/widget-avatar/README.md`). `build.mjs` copies them from `../assets/widget-avatar/` into `dist/`. Do not modify anything in `assets/`.

### All other files
No analog exists. Follow the RESEARCH.md Architecture Patterns and the structure tree (RESEARCH ~lines 178-210) as written.

## Shared Patterns (from RESEARCH, enforced by tests)
- **Single read site:** `getSelection` appears only in `src/content/capture.js`.
- **Single send site:** `chrome.runtime.sendMessage` appears only in `src/core/integration.js`.
- **No persistence:** the manifest has no `storage` permission and no `host_permissions`. Drafts live in memory only (`draft.js`).
- **Polish strings:** every Polish string lives in `strings.pl.js` (D-16).
- **Pure UI:** `panel.js` contains no `chrome.*` calls.
- **Duplicate guard:** `main.js` starts with `if (document.querySelector('bezpieczna-aura-widget')) return;`.
- **Code location:** code goes only in `projects/widget/`. `.planning/shared/` is read-only.

## No Analog Found
All 22 code, config and test files above. The repo has no existing source code. Use the RESEARCH.md patterns.

## Metadata
**Search scope:** `git ls-files` across the repo (excluding `.planning`, `.claude`). The only tracked non-planning content is `assets/`.
