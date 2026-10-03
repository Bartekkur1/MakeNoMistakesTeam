# Phase 1: Rozszerzenie i przekazanie treści - Research

**Researched:** 2026-10-03
**Domain:** Chrome Manifest V3 extension: content-script-injected avatar in Shadow DOM, user-initiated selection capture, in-memory per-tab draft, Playwright testing with an unpacked extension
**Confidence:** HIGH for the core mechanics (selection capture, CSP behavior, extension loading, all probed against the local Chromium 152). MEDIUM for Discord-specific behavior (focus stealing, layout), which needs a manual check on a logged-in fictional account.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Model pomocy i dostęp do treści
- **D-01:** Pomocnik startuje **tylko na prośbę dziecka** (kliknięcie awatara). Poza naszą grą Roblox żadnego automatycznego reagowania ani monitorowania. (Roblox to osobny workstream.)
- **D-02:** Pomocnik dostaje **wyłącznie wybrany tekst i opcjonalny link**: to, co dziecko zaznaczyło lub wkleiło. Bez całej rozmowy i bez otaczającego kontekstu.
- **D-03:** Przed zatwierdzeniem: **podgląd treści, edycja (np. usunięcie imienia czy danych), opcjonalne pole na link i informacja, że treść i wynik zobaczy opiekun**. Zatwierdzenie to granica: dopiero ono tworzy sprawę (w fazie 3 wysyłaną od razu). Wyświetlenie awatara, otwarcie okna i podgląd **nie tworzą sprawy**.
- **D-04:** Szerokie uprawnienia potrzebne do obecności na stronach **nie są zgodą na czytanie ich treści**. Odczyt strony tylko w reakcji na kliknięcie awatara i tylko z bieżącego zaznaczenia. Egzekwowane w kodzie i sprawdzone testem (np. brak listenerów czytających DOM/zaznaczenie w tle, brak wysyłki czegokolwiek przed zatwierdzeniem).

#### Platforma i obecność awatara
- **D-05:** MVP: **rozszerzenie Chrome (Manifest V3)** na zwykłych stronach i **Discordzie w przeglądarce**. Bez desktopowej i mobilnej aplikacji Discord.
- **D-06:** Awatar jest **automatycznie widoczny na wszystkich stronach**, na których Chrome pozwala działać rozszerzeniom (bez listy witryn i bez ręcznego włączania).
- **D-07:** Awatar można **przeciągać i schować na bieżącej stronie**. Po schowaniu wraca po przeładowaniu strony albo po kliknięciu ikony rozszerzenia.

#### Okno pomocnika
- **D-08:** Kliknięcie awatara otwiera **małe okno przy awatarze**. Nie panel boczny Chrome i nie duże okno modalne.
- **D-09:** Jeśli dziecko ma zaznaczony tekst, kliknięcie awatara otwiera **podgląd z zaznaczeniem** (D-03).
- **D-10:** Bez zaznaczenia okno pokazuje **menu z dwoma przyciskami**: „Sprawdź wiadomość” (pole do wklejenia tekstu/linku, potem ten sam podgląd) oraz „Jak to działa”.
- **D-11:** „Jak to działa” to **3 kroki** (1. zaznacz wiadomość, 2. kliknij mnie, 3. sprawdź i zatwierdź) i jedno zdanie o prywatności w duchu: „Widzę tylko to, co mi pokażesz; zatwierdzoną sprawę zobaczy Twój opiekun”.
- **D-12:** **Szkic** (niezatwierdzona, edytowana treść) **przetrwa zamknięcie okna w obrębie tej samej karty**. Po ponownym kliknięciu awatara szkic wraca. Zamknięcie karty, przeładowanie albo przejście na inną stronę w karcie kasuje szkic. **Nic nie zapisujemy na dysku** (bez `chrome.storage` dla treści).
- **D-13:** Przy zmianie karty okno **zostaje na swojej karcie**. Na innych kartach go nie ma, a po powrocie stan jest taki jak przed wyjściem. Okno nie „chodzi” za dzieckiem między kartami.

#### Wygląd
- **D-14:** Awatar to **nowa grafika na bazie `assets/Scamerino_Alertinio.png`**, przygotowana pod mały przycisk (przezroczyste tło, czytelna przy 48–64 px) i ikony rozszerzenia 16/32/48/128. Generowanie zlecone Codexowi 2026-10-03, z wynikiem w `assets/widget-avatar/`. Wynik wymaga weryfikacji przez użytkownika. Do czasu akceptacji kod może używać tymczasowej ikony.
- **D-15:** Okno i awatar używają **palety `assets/scamerino_palette.css`** (shark-blue `#0F62DB`, siren-amber, hook-crimson itd.) i zaokrągleń 20px (`widget` radius).
- **D-16:** Interfejs **tylko po polsku**, język dla dzieci 9–13 lat.

#### Ustalenia dla późniejszych faz (NIE implementować w fazie 1)
- **Faza 2:** najpierw krótka wskazówka bezpieczeństwa, potem 2–3 pytania, wyjaśnienie sygnałów i proponowany krok. Bez gwarancji bezpieczeństwa.
- **Faza 3:** **każda zatwierdzona sprawa automatycznie i od razu trafia do opiekuna** ze statusem „sprawdzanie w toku”, a wynik dopisuje się później. Przerwanie rozmowy nie usuwa sprawy. Dziecko nie wybiera osobno „Pokaż opiekunowi”, bo zgoda jest w zatwierdzeniu (D-03). Opiekun dostaje tylko przekazaną sprawę. Nauczyciel nie dostaje prywatnych spraw. Nieudana wysyłka jest jawna, bez fikcyjnego potwierdzenia.
- To **zmienia starszy model** z HND-02 / `ideas/defence/koncepcja.md` (opcjonalny przycisk „Pokaż opiekunowi”). Przed fazą 3 trzeba zaktualizować REQUIREMENTS i uzgodnić kontrakt z `api-ui`.

### Claude's Discretion
- Struktura katalogu `projects/widget/` (content script / service worker / popup), bundler lub jego brak, framework UI (np. vanilla + Shadow DOM, Preact).
- Izolacja stylów okna od strony (Shadow DOM zalecany, żeby strony nie psuły wyglądu i odwrotnie).
- Pozycja startowa awatara (np. prawy dolny róg z odstępem od pól pisania Discorda) i czy pozycja po przeciągnięciu jest pamiętana (sama pozycja to nie treść, więc może trafić do `chrome.storage`).
- Nawigacja SPA (np. zmiana kanału w Discordzie bez przeładowania): domyślnie **nie** kasuje szkicu. Kasuje go tylko przeładowanie lub zmiana dokumentu.
- Co widać po zatwierdzeniu w fazie 1, zanim istnieje faza 2: neutralny ekran potwierdzenia i ustrukturyzowany obiekt sprawy (tekst, link, źródło/URL strony, czas) przekazany do punktu integracji, bez wysyłki sieciowej.
- Narzędzia testów (np. Vitest + Playwright z załadowanym rozszerzeniem).

### Deferred Ideas (OUT OF SCOPE)
- Ścieżka pytań i wynik: faza 2. Wysyłka do opiekuna, odpowiedź opiekuna i błędy: faza 3. Strona mobilna: faza 4.
- Zrzuty ekranu z zamazywaniem danych, analiza wspomagana AI, natywne aplikacje: v2 (WID-V2-01..03).
- Pomocnik reagujący sam w zaplanowanych momentach: tylko we własnej grze Roblox (osobny workstream).
- Punkty za trening, a nie za liczbę prawdziwych zgłoszeń (`.planning/shared/MEASUREMENT.md`).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WID-01 | Użytkownik uruchamia awatara w rozszerzeniu na komputerze | MV3 manifest with a static `content_scripts` entry on `<all_urls>` (D-06); avatar host element with Shadow DOM, styles that survive strict page CSP (probed); drag, hide and restore through `chrome.action.onClicked` and `tabs.sendMessage` (D-07); icons from `assets/widget-avatar/` (D-14). See Patterns 1–4. |
| WID-02 | Użytkownik przekazuje zaznaczoną treść albo wkleja wiadomość/link ręcznie; dostęp do strony tylko na działanie użytkownika | Selection is read only in the avatar click handler. `mousedown` is cancelled and the avatar has `user-select:none`, so the selection survives the click (probed, Pattern 5). The draft is a per-tab in-memory state machine, cleared on `pagehide` (bfcache pitfall). Approval sends one runtime message to the service worker as the integration point, with no network. D-04 proof: unit spies, a static source scan and E2E checks. See Testing Strategy. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

There is no `./CLAUDE.md` or `./.claude/CLAUDE.md` in the repo, and no project skills (`.claude/skills/`, `.agents/skills/` absent). `[VERIFIED: ls in this session]` These directives apply instead:
- Code goes **only** in `projects/widget/`. `.planning/shared/` is read-only (source: `.planning/shared/README.md:13`, verbatim: "Każdy workstream pracuje wyłącznie w `.planning/workstreams/<nazwa>/` i w swoim katalogu kodu (`projects/api-ui/`, `projects/widget/`, `projects/roblox/`, `projects/presentation/`)."). Reading `assets/` at build time is fine. Do not modify `assets/Scamerino_Alertinio.png`.
- No secrets in the extension (source: `.planning/shared/CONTRACT.md:41`, verbatim: "Sekrety nigdy w kliencie (Roblox, rozszerzenie).").
- Docs commits use `docs(...)`. The user's standing rule is that **every git commit needs explicit user confirmation** (user memory). The planner and executor must not auto-commit without that confirmation.
- Demo uses fictional data only (`.planning/PROJECT.md` Constraints: "tylko fikcyjne dane").
- There is no root `.gitignore`. `projects/widget/` needs its own `.gitignore` (`node_modules/`, `dist/`, `test-results/`, `playwright-report/`).

## Summary

This is a greenfield, single-developer, ~24h build. Use **vanilla JavaScript (ES modules) with esbuild**, no UI framework. One static content script on `<all_urls>` mounts a uniquely named host element (`<bezpieczna-aura-widget>`) with a Shadow DOM. The avatar button and the small window both live in that same shadow root. A minimal service worker handles the toolbar icon click (restore a hidden avatar) and acts as the phase-1 integration point for approved cases, keeping them in memory with no network. Don't define `default_popup`: if it is set, `action.onClicked` never fires `[CITED: developer.chrome.com/docs/extensions/reference/api/action]`.

The main correctness risk was "clicking the avatar clears the selection". It was **probed on the local Chromium 152** with real CDP mouse events. When the clicked element has selectable text and `mousedown` is not cancelled, the selection is still intact at `pointerdown`/`mousedown` but is **empty by `click`**. With `user-select:none` or `mousedown.preventDefault()`, the selection survives to `click`. A `<button>` also keeps it. Selections inside a page `<textarea>` are returned by `getSelection().toString()` in Chromium 152 `[VERIFIED: local CDP probe, output below]`. So read the selection **once, inside the avatar's click handler**, with `user-select:none` on the avatar and a cancelled `mousedown` as safeguards. That keeps D-04 literal: the only `getSelection()` call sits behind a user click.

Strict page CSP is a non-issue for content-script DOM. Under `default-src 'self'; img-src 'self'; style-src 'self'; frame-src 'none'`, a content script's `<style>` in the shadow root, `adoptedStyleSheets`, a web-accessible PNG, a `data:` PNG and even an extension iframe all loaded `[VERIFIED: local probe]`. Discord's real CSP allows `'unsafe-inline'` styles and `data:`/`blob:` images anyway `[VERIFIED: curl of discord.com headers]`. Two real pitfalls remain on Discord. (1) Keystrokes typed in our textarea are `composed` events that bubble to the page, and Discord focuses its composer when you type "anywhere". Contain keyboard and clipboard events at the shadow root and check manually on Discord. An extension-page iframe is the proven fallback. (2) bfcache restores the content-script heap on Back, which would revive the draft and violate D-12. Clear all state on `pagehide` `[CITED: developer.chrome.com/blog/bfcache-extension-messaging-changes]`.

**Primary recommendation:** Build a vanilla JS + esbuild MV3 extension. Use one content script and an **open** Shadow DOM (keeps Playwright testing possible). The selection is read only in the avatar click handler, and the draft is an in-memory state object reset on `pagehide`. Approval produces exactly one `chrome.runtime.sendMessage` to an in-memory service-worker store. D-04 is proven by (a) a Vitest/happy-dom spy test, (b) a static source-scan test and (c) Playwright E2E checks of the service worker's message log and network requests.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Avatar presence on every page (D-06) | Content script (isolated world, page DOM) | — | Only content scripts can render into page DOM. A static `content_scripts` entry needs no user action. |
| Style isolation, z-index, drag, hide | Content script → Shadow DOM | — | Per-document UI. State is per document, so per tab, which gives D-13 for free. |
| Selection capture (D-04, D-09) | Content script, inside avatar `click` handler only | — | Must happen in the page's document at the moment of the user gesture. |
| Draft state (D-12) | Content-script memory (JS variable) | — | Dies with the document (reload, close, navigation), survives SPA pushState. No `chrome.storage`. |
| Window UI (menu / paste / preview / how-it-works / confirmation) | Content script UI module (pure DOM, no `chrome.*`) | Reused by the phase-4 mobile page | Keeping it free of `chrome.*` lets phase 4 mount the same module in a plain web page. |
| Restore hidden avatar on icon click (D-07) | Service worker (`chrome.action.onClicked`) | Content script (`runtime.onMessage` "show") | The toolbar icon event only reaches the extension's background context. |
| Approved-case integration point (phase 1, no network) | Service worker (in-memory list) | — | Phase 2 (check flow) and phase 3 (`api-ui` POST) hook in here. Network belongs off the page's origin and CSP. |
| Icons / avatar images | Extension package (`dist/icons/`, web-accessible) | — | Static assets copied from `assets/widget-avatar/` at build time. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Chrome Extensions MV3 platform APIs (`chrome.action`, `chrome.runtime`, `chrome.tabs`, `chrome.scripting`) | Chrome / Chromium ≥ 120, local is 152 | Extension runtime | Locked by D-05 |
| esbuild | 0.28.2 (published 2026-08-08) | Bundle `src/content/main.js` and `src/background/sw.js` into classic IIFE files, import CSS as text, copy assets via a small `build.mjs` | Static content scripts cannot be ES modules, so a bundler is needed to write modular code that Vitest can import. esbuild is one dependency with no config framework and builds in under a second. |
| Vanilla DOM + Shadow DOM (`attachShadow({mode:'open'})`) | platform | UI | The UI is about 5 small screens. A framework adds build and test overhead and its own style-injection quirks inside shadow roots. |

### Supporting (dev only)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 5.0.1 (pin; latest 5.0.3 is 3 days old) | Unit tests: draft state machine, case builder, UI rendering, **D-04 spy test**, static source scan | Every task |
| happy-dom | 20.14.5 | DOM environment for Vitest (`environment: 'happy-dom'`) `[CITED: vitest.dev/config/environment]` | Unit tests that touch the DOM |
| @playwright/test | 1.63.0 | E2E with the unpacked extension in a persistent context `[CITED: playwright.dev/docs/chrome-extensions]` | Selection → preview → approve flow, hide/restore, no-network check |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild + `build.mjs` | Plain files, no bundler (several `js` files listed in `content_scripts`, which share one isolated world) | Zero tooling, but no `import`, so Vitest can't import modules cleanly. Rejected. |
| esbuild | Vite 8.3.2 + @crxjs/vite-plugin 3.0.0 (published 2026-09-24) | HMR for content scripts, but a new major version 9 days old plus more config surface. Not worth the risk in 24h. |
| esbuild | WXT 0.21.4 | A full framework with its own conventions and learning curve. Overkill for one content script and one worker. |
| Vanilla | Preact 11.0.0 (published 2026-09-30) | Nicer components, but a brand-new major version. Vanilla is enough for 5 screens. |
| Shadow DOM panel | Extension-page iframe (`chrome-extension://…/panel.html` as a web-accessible resource) | Full keystroke, style and content isolation from the page (it loaded even under `frame-src 'none'` in the probe). The cost is two contexts plus messaging. Keep it as the **fallback** if Discord steals keystrokes (Pitfall 3). |
| Plain JS | TypeScript 7.0.2 (published today) | Type safety, but adds a compile step or `@types/chrome` setup. Skip for the hackathon. |

**Installation (inside `projects/widget/`):**
```bash
cd projects/widget
npm init -y
npm install --save-dev --save-exact esbuild@0.28.2 vitest@5.0.1 happy-dom@20.14.5 @playwright/test@1.63.0
npx playwright install chromium   # bundled Chromium; or use system /usr/bin/chromium via executablePath (verified to load extensions)
```

**Version verification:** `npm view <pkg> version` and `npm view <pkg> time --json` were run this session `[VERIFIED: npm registry]`. Latest: esbuild 0.28.2, vitest 5.0.3 (5.0.1 published 2026-09-15), happy-dom 20.14.5, @playwright/test 1.63.0. Context for the alternatives: vite 8.3.2, @crxjs/vite-plugin 3.0.0, wxt 0.21.4, preact 11.0.0, typescript 7.0.2.

## Package Legitimacy Audit

Command run: `gsd-tools query package-legitimacy check --ecosystem npm esbuild vitest @playwright/test happy-dom`

| Package | Registry | Age (latest) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| esbuild | npm | 0.28.2 published 2026-08-08 | ~351M/wk | github.com/evanw/esbuild | [OK] | Approved. Its `postinstall: node install.js` fetches the platform binary as optional deps; this is known, documented behavior. |
| vitest | npm | 5.0.3 published 2026-09-30 | ~135M/wk | github.com/vitest-dev/vitest | [SUS] (reason: `too-new`) | Flagged. The project is established and only the latest release is new. Pin 5.0.1. Planner adds `checkpoint:human-verify` before install. |
| @playwright/test | npm | 1.63.0 | ~82M/wk | github.com/microsoft/playwright | [SUS] (reason: `too-new`) | Flagged. Same reasoning. Pin 1.63.0. `checkpoint:human-verify`. |
| happy-dom | npm | 20.14.5 published 2026-09-12 | ~23M/wk | github.com/capricorn86/happy-dom | [SUS] (reason: `too-new`) | Flagged. Pin 20.14.5. `checkpoint:human-verify`. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** vitest, @playwright/test, happy-dom. All three were flagged only for "too-new" on the latest release; all are mainstream projects with tens of millions of weekly downloads. The planner inserts one `checkpoint:human-verify` before the `npm install` task.
**Name provenance:** vitest and happy-dom are named in the official Vitest docs, and @playwright/test is from the official Playwright docs (both fetched this session). esbuild's name comes from training knowledge plus an OK registry verdict, so it is `[ASSUMED]` per the provenance rule. No postinstall scripts on vitest, @playwright/test or happy-dom.

## Architecture Patterns

### System Architecture Diagram

```
 Page (any http/https, incl. discord.com)          Extension
 ┌───────────────────────────────────────┐        ┌──────────────────────────────┐
 │ document_idle → content.js (isolated) │        │ sw.js (service worker)       │
 │   mount <bezpieczna-aura-widget>      │        │                              │
 │   └─ shadowRoot (open)                │        │ action.onClicked(tab) ───────┼──┐
 │       ├─ [Avatar button] ◄─ drag/hide │        │                              │  │ tabs.sendMessage
 │       │      │ click (no drag)        │        │ runtime.onMessage:           │  │ {type:'aura/show'}
 │       │      ▼                        │        │   'aura/case-approved' ──►   │  │
 │       │  captureSelection()  ◄── ONLY │        │   cases[] (memory, no net)   │  │
 │       │  page read, user-initiated    │        │   → reply {ok:true}          │  │
 │       │      │ text?                  │        └──────────────▲───────────────┘  │
 │       │   yes│        no              │                       │                  │
 │       │      ▼         ▼              │                       │                  │
 │       │  Preview ◄── Menu ─► HowTo    │                       │                  │
 │       │  (edit text, link,  "Sprawdź  │                       │                  │
 │       │   guardian notice)  wiadomość"│                       │                  │
 │       │      │            → Paste ──► Preview                 │                  │
 │       │      │ "Zatwierdzam"          │                       │                  │
 │       │      ▼                        │                       │                  │
 │       │  buildCase() → submitCase() ──┼── runtime.sendMessage ┘                  │
 │       │      │ ok → Confirmation; draft cleared               │                  │
 │       └─ draft (in-memory) ◄── reset on pagehide (reload/nav/bfcache)            │
 │   runtime.onMessage('aura/show') ◄─────────────────────────────────────────────┘
 └───────────────────────────────────────┘
```

### Recommended Project Structure
```
projects/widget/
├── package.json            # scripts: build, watch, test, test:e2e
├── build.mjs               # esbuild → dist/; copies manifest + icons from ../assets/widget-avatar/
├── manifest.json           # source manifest (copied to dist/)
├── .gitignore              # node_modules/ dist/ test-results/ playwright-report/
├── vitest.config.mjs
├── playwright.config.mjs
├── src/
│   ├── content/
│   │   ├── main.js         # bootstrap: duplicate guard, mount, onMessage('aura/show'), pagehide reset
│   │   ├── host.js         # create host + shadowRoot + adoptedStyleSheets, keyboard containment
│   │   ├── avatar.js       # button, drag (pointer events), hide, click → controller
│   │   └── capture.js      # captureSelection(): the ONLY file allowed to call getSelection()
│   ├── ui/
│   │   ├── panel.js        # views: menu, paste, preview, howto, confirmation (pure DOM, no chrome.*)
│   │   ├── strings.pl.js   # every Polish string in one place (D-16)
│   │   └── widget.css      # imported as text; palette imported from ../../../../assets/
│   ├── core/
│   │   ├── draft.js        # per-tab draft state machine (memory only)
│   │   ├── case.js         # buildCase({text, link, origin}) → normalized, length-capped object
│   │   └── integration.js  # submitCase(case) → chrome.runtime.sendMessage (the single send site)
│   └── background/
│       └── sw.js           # action.onClicked → show; onMessage case-approved → cases[]; self.__aura test seam
└── tests/
    ├── unit/               # *.test.js (vitest + happy-dom), incl. no-background-reading.test.js, source-scan.test.js
    └── e2e/
        ├── server.mjs      # node:http static server for fixtures on 127.0.0.1
        ├── fixtures/       # chat-like.html (fake Discord message, fictional)
        ├── extension.fixture.mjs
        └── *.spec.mjs
```

### Pattern 1: Manifest (no popup, minimal permissions)
**What:** A static content script on all pages, a classic service worker and an action with no popup. No `storage` permission at all in phase 1. Dropping position persistence makes the privacy story simple.
```json
{
  "manifest_version": 3,
  "name": "BezpiecznaAura – Scamerinio",
  "version": "0.1.0",
  "description": "Pomocnik, który sprawdza tylko to, co mu pokażesz.",
  "icons": { "16": "icons/icon-16.png", "32": "icons/icon-32.png", "48": "icons/icon-48.png", "128": "icons/icon-128.png" },
  "action": { "default_title": "Pokaż Scamerinio", "default_icon": { "16": "icons/icon-16.png", "32": "icons/icon-32.png" } },
  "background": { "service_worker": "sw.js" },
  "content_scripts": [
    { "matches": ["<all_urls>"], "js": ["content.js"], "run_at": "document_idle", "all_frames": false }
  ],
  "permissions": ["activeTab", "scripting"],
  "web_accessible_resources": [
    { "resources": ["icons/avatar-64.png", "icons/avatar-128.png"], "matches": ["<all_urls>"], "use_dynamic_url": true }
  ]
}
```
Notes: `run_at` defaults to `document_idle` and `all_frames` defaults to `false` (top frame only) `[CITED: developer.chrome.com/docs/extensions/develop/concepts/content-scripts]`. `use_dynamic_url` makes the resource reachable only through a per-session ID, which limits fingerprinting `[CITED: developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources]`. `activeTab` + `scripting` are only needed for the optional "inject into a tab opened before install" path in Pattern 4. Drop both if that path is skipped. Icon file names are taken verbatim from `assets/widget-avatar/README.md:11-18`: "avatar-master.png | 1024 × 1024", "avatar-128.png | 128 × 128", "avatar-64.png | 64 × 64", "avatar-48.png | 48 × 48", "icon-16.png | 16 × 16", "icon-32.png | 32 × 32", "icon-48.png | 48 × 48", "icon-128.png | 128 × 128" `[VERIFIED: assets/widget-avatar/README.md:11-18, files confirmed by ls]`.

### Pattern 2: Host + Shadow DOM that survives hostile pages
**What:** Use an uniquely named, unregistered custom element as host, an open shadow root, `:host { all: initial }`, the maximum z-index and px units only.
```js
// src/content/host.js
import widgetCss from '../ui/widget.css';                  // esbuild loader: text
import paletteCss from '../../../../assets/scamerino_palette.css';

export function createHost(doc = document) {
  const host = doc.createElement('bezpieczna-aura-widget'); // DON'T call customElements.define: it is null in content scripts
  const root = host.attachShadow({ mode: 'open' });          // open: Playwright can pierce it (closed is unsupported)
  const sheet = new CSSStyleSheet();
  // Palette is written for :root, which never matches inside a shadow tree, so rebase it onto :host.
  sheet.replaceSync(paletteCss.replace(':root', ':host') + '\n' + widgetCss);
  root.adoptedStyleSheets = [sheet];
  // Keep typing/clipboard inside our UI (Discord "type anywhere to focus composer", page hotkeys).
  for (const t of ['keydown', 'keyup', 'keypress', 'beforeinput', 'input', 'paste', 'copy', 'cut']) {
    root.addEventListener(t, (e) => e.stopPropagation());
  }
  doc.documentElement.appendChild(host); // <html>, not <body>: survives SPA body re-renders
  return { host, root };
}
```
```css
/* widget.css (excerpt) */
:host { all: initial; position: fixed; z-index: 2147483647; --radius-widget: 20px; /* palette uses 1.25rem; rem follows the PAGE root font-size */
        font: 15px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--color-text-primary); }
.avatar { width: 64px; height: 64px; padding: 0; border: 0; background: none; cursor: grab;
          user-select: none; -webkit-user-select: none; touch-action: none; }
.avatar img { width: 64px; height: 64px; -webkit-user-drag: none; pointer-events: none; } /* no circular clip: it cuts the fin */
.panel { width: 320px; max-height: calc(100vh - 32px); overflow: auto; border-radius: var(--radius-widget);
         background: var(--color-surface-card); box-shadow: var(--shadow-shield-card); }
```
Evidence:
- `customElements` is `null` in the isolated world `[VERIFIED: local probe printed "ce":"null"]`.
- The page main world can reach an open shadow root (`"pageSeesShadow":true`) `[VERIFIED: local probe]`. This is an accepted trade-off, see Security.
- The palette rule is quoted from `assets/scamerino_palette.css:7,36` `[VERIFIED: file read]`: `:root {` and `--radius-widget: 1.25rem; /* 20px */`. Other tokens used above, verbatim: `--color-text-primary: #0F172A;` (line 30), `--color-surface-card: #FFFFFF;` (line 29), `--shadow-shield-card: 0 4px 20px -2px rgba(15, 98, 219, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);` (line 35), `--color-shark-blue: #0F62DB;` (line 9).
- Fonts: Discord's `font-src` has no `data:`, and `@font-face` inside a shadow root is not applied anyway `[ASSUMED]`, so use the system font stack.

### Pattern 3: Avatar click vs drag, with user-initiated selection capture
**What:** One element handles both drag and click. Capture the selection **only** in `click`, and only when the gesture was not a drag.
```js
// src/content/capture.js : the ONLY module allowed to touch the page selection
const MAX = 2000;
export function captureSelection(doc = document) {
  const ae = doc.activeElement;
  let text = '';
  if (ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && /^(text|search|url)$/i.test(ae.type)))) {
    text = ae.value.slice(ae.selectionStart ?? 0, ae.selectionEnd ?? 0);
  }
  if (!text) text = doc.getSelection()?.toString() ?? '';
  text = text.replace(/ /g, ' ').trim();
  return { text: text.slice(0, MAX), truncated: text.length > MAX };
}
```
```js
// src/content/avatar.js (excerpt)
const DRAG_PX = 5;
btn.addEventListener('mousedown', (e) => e.preventDefault()); // keeps page selection + focus intact
btn.addEventListener('pointerdown', (e) => {
  start = { x: e.clientX, y: e.clientY }; dragged = false; btn.setPointerCapture(e.pointerId);
});
btn.addEventListener('pointermove', (e) => {
  if (!start) return;
  if (!dragged && Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_PX) dragged = true;
  if (dragged) moveTo(clampToViewport(e.clientX, e.clientY));
});
btn.addEventListener('pointerup', () => { start = null; });
btn.addEventListener('click', () => {
  if (dragged) { dragged = false; return; }    // a drag is not a request for help
  controller.onAvatarClick(captureSelection()); // D-04: the single read, on the user's click
});
```
**Evidence** (Chromium 152, real `Input.dispatchMouseEvent`, text selected in a `<p>`, avatar inside a closed shadow root) `[VERIFIED: local CDP probe this session]`:
```
a (button, no preventDefault)       after click selection = "Darmowe Nitro! ..."   activeElement = host
b (button, mousedown preventDefault) after click selection = "Darmowe Nitro! ..."
c (div, user-select:none)            after click selection = "Darmowe Nitro! ..."
e (div, selectable text, no prevent) after click selection = ""     ← pointerdown/mousedown still had it; click did not
g (div, selectable, mousedown preventDefault) after click selection = "Darmowe Nitro! ..."
textarea selection: [{"sel":"Moje imie Ola","ae":"TEXTAREA","ta":"Moje imie Ola"}]
```

### Pattern 4: Hide and restore (D-07) through the toolbar icon
```js
// src/background/sw.js
const cases = [];      // phase-1 integration point (memory only; SW may be killed after ~30 s idle, fine for phase 1)
const messages = [];   // test seam: every message the SW ever received
async function onActionClicked(tab) {
  if (!tab?.id) return;
  try { await chrome.tabs.sendMessage(tab.id, { type: 'aura/show' }); }
  catch {               // no receiver: chrome:// page, Web Store, or a tab opened before install
    try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); } catch {}
  }
}
chrome.action.onClicked.addListener(onActionClicked);
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  messages.push({ type: msg?.type, at: Date.now() });
  if (sender.id !== chrome.runtime.id || !sender.tab) return;           // only our own content scripts
  if (msg?.type === 'aura/case-approved') { cases.push(msg.case); sendResponse({ ok: true }); }
});
self.__aura = { cases, messages, onActionClicked };                       // used by Playwright via serviceWorker.evaluate
```
- `main.js` guards against double injection with `if (document.querySelector('bezpieczna-aura-widget')) return;`. This reads only our own element. Programmatic injection runs in the same isolated world as the static script `[ASSUMED]`.
- "Hidden" is a memory flag, so a reload brings the avatar back (D-07) with no storage needed.
- Hiding also closes the window but **keeps** the draft (D-12: closing the window keeps the draft).

### Pattern 5: Draft state machine (D-09, D-10, D-12, D-13)
```js
// src/core/draft.js : plain object, unit-testable, no chrome.*, no storage
export function createDraftStore() {
  let state = { view: 'closed', draft: null, hidden: false }; // draft: {text, link, origin:'selection'|'paste', truncated}
  return {
    get: () => state,
    onAvatarClick({ text, truncated }) {
      if (state.draft) return (state = { ...state, view: 'preview', pendingSelection: text || null });
      if (text) return (state = { ...state, view: 'preview', draft: { text, link: '', origin: 'selection', truncated } });
      return (state = { ...state, view: 'menu' });
    },
    edit(patch) { state = { ...state, draft: { ...state.draft, ...patch } }; },
    close() { state = { ...state, view: 'closed' }; },      // draft survives (D-12)
    approved() { state = { ...state, view: 'confirmation', draft: null }; },
    resetForNewDocument() { state = { view: 'closed', draft: null, hidden: false }; },
  };
}
// main.js: window.addEventListener('pagehide', () => store.resetForNewDocument());  // bfcache: see Pitfall 4
```
- **D-13 needs no code:** each tab's document runs its own content-script instance with its own memory. Switching tabs doesn't touch it.
- **SPA navigation** (Discord channel switch, `history.pushState`) keeps the same document and the same isolated world, so the draft survives, which is the discretion default `[ASSUMED, standard same-document behavior]`. Do **not** add `popstate`/`hashchange`/URL-polling listeners.
- **Draft + new selection conflict:** D-12 (restore the draft) and D-09 (a selection opens the preview) collide when a draft already exists. Recommendation: restore the draft and show a small „Wstaw nowe zaznaczenie” button that swaps in `pendingSelection`. See Open Question 1.

### Pattern 6: Case object and integration point (phase 1, no network)
```js
// src/core/case.js
export function buildCase({ text, link, origin }, now = new Date(), loc = location) {
  const content = String(text ?? '').trim().slice(0, 2000);
  if (!content) throw new Error('empty');
  return { content, link: normalizeLink(link), origin, source: loc.hostname, created_at: now.toISOString() };
}
// src/core/integration.js : the ONLY call site allowed to send anything
export async function submitCase(c) {
  const res = await chrome.runtime.sendMessage({ type: 'aura/case-approved', case: c });
  if (!res?.ok) throw new Error('not-accepted');
  return res;
}
```
- `content`, `source` and `created_at` follow the CONTRACT field names. The verbatim row from `.planning/shared/CONTRACT.md:25` is "| Sprawa | id, demo_child_id, source, content, signals, selected_action, already_acted, status (nowa / w rozmowie / zakończona), created_at |" `[VERIFIED: file read]`. `link` and `origin` are additions that phase 3 must reconcile with `api-ui` `[ASSUMED]`.
- **Use the hostname, not the full URL**, for `source`. A Discord URL carries server and channel IDs, which is surrounding context that D-02 excludes. Show the hostname in the preview so the child sees everything that is shared.
- Show the confirmation **only after** `{ok:true}`. On failure (for example "Extension context invalidated"), show „Coś poszło nie tak. Odśwież stronę i spróbuj jeszcze raz.” and keep the draft.
- The phase-1 confirmation copy must **not** say the case was sent to the guardian, because nothing is sent yet. Use neutral copy, for example „Gotowe! Sprawa jest przygotowana do sprawdzenia.”

### Anti-Patterns to Avoid
- **Listening for `selectionchange`, `selectstart`, `mouseup`, `keyup`, `copy`, or using `MutationObserver` on the page "to show the avatar when text is selected":** this directly violates D-04. The avatar is always visible, and reading happens only on click.
- **`innerHTML` with selected or pasted text:** always use `textContent` / `textarea.value`. Never render the link as an `<a href>`. Show it as plain text so the suspicious link can't be clicked from our UI, and never fetch it, expand it or preview it.
- **Reading `href`s or DOM around the selection** (sender name, timestamps, neighboring messages): this violates D-02. If the child wants the link, it is either in the selected text or they paste it.
- **`chrome.storage` / `localStorage` / `sessionStorage` / IndexedDB for the draft:** violates D-12. Page-origin storage is also readable by the page.
- **`default_popup` in the manifest:** kills `action.onClicked` (D-07 restore).
- **Appending the host to `<body>` on SPA apps:** React apps can replace body children. Append to `document.documentElement`.
- **`customElements.define()` in the content script:** throws, because the registry is null.
- **Using `rem` / `em` from page-relative sizes:** the page controls the root font-size. Use px.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Style isolation from the host page | CSS prefixing / `!important` everywhere | Shadow DOM + `:host{all:initial}` + `adoptedStyleSheets` | Page selectors can't cross the shadow boundary. Only inherited properties leak, and `all:initial` resets them. |
| Bundling modular content scripts | Concatenation scripts | esbuild `bundle:true, format:'iife'` | Handles imports, the CSS text loader and sourcemaps in one call. |
| Loading the extension in tests | Custom CDP launcher | `chromium.launchPersistentContext` with `--disable-extensions-except` / `--load-extension` `[CITED: playwright.dev/docs/chrome-extensions]` | Playwright gives the service worker handle and the extension ID. |
| Drag tracking | `mousemove` on `document` | Pointer events + `setPointerCapture` on the avatar | Captured pointer events keep arriving at the avatar even off-element. **No document-level listeners**, which keeps the D-04 audit trivial. |
| Restoring the avatar across tabs | Polling / broadcasting | `action.onClicked` → `tabs.sendMessage(tab.id)` | Targets only the active tab, matching D-13. |
| Focus/keystroke isolation if Shadow DOM isn't enough | Global key interceptors | Extension-page iframe panel (fallback) | Cross-origin frame = real isolation. It loaded under `frame-src 'none'` `[VERIFIED: local probe]`. |

**Key insight:** The hard part of this phase is not the UI. It is proving that the extension does **not** do things. Keep every capability in one choke point: one module that reads the page (`capture.js`) and one module that sends (`integration.js`). Then "no background reading" can be checked by a source scan, a spy test and an E2E message log.

## Common Pitfalls

### Pitfall 1: Selection gone by the time `click` fires
**What goes wrong:** The child selects the scam message, clicks the shark, and the menu opens instead of the preview.
**Why it happens:** `mousedown` on selectable content starts a new selection, which collapses the old one before `click` (probed: case `e`).
**How to avoid:** Give the avatar `user-select:none`, call `mousedown.preventDefault()` and use `pointer-events:none` on the inner `<img>` (no native image drag). Read the selection in `click`.
**Warning signs:** The E2E "select, then click avatar, then preview shows text" test fails or flakes.

### Pitfall 2: Palette tokens not applied inside the shadow root
**What goes wrong:** The widget renders unstyled or with the page's colors.
**Why it happens:** `assets/scamerino_palette.css` declares tokens on `:root` (line 7), which never matches inside a shadow tree. `--radius-widget: 1.25rem` (line 36) depends on the page's root font-size.
**How to avoid:** Use `paletteCss.replace(':root', ':host')` and override `--radius-widget: 20px` on `:host`. Add a unit test that the generated sheet contains `:host {` and `#0F62DB`.

### Pitfall 3: Discord steals keystrokes typed into our textarea
**What goes wrong:** While the child edits the preview, characters land in Discord's message composer, or a Discord hotkey fires. In the worst case the child's text is posted to the chat.
**Why it happens:** Keyboard and clipboard events are `composed` and bubble from the shadow tree to `document`/`window`. `document.activeElement` is our host, a non-editable element, so "type anywhere to focus composer" logic sees no focused input `[CITED: Discord support threads about auto-focusing the chatbox; github.com/RaphaelRegnier/vibe-annotations/pull/89 for the containment pattern]`.
**How to avoid:** Call `stopPropagation()` on `keydown/keyup/keypress/beforeinput/input/paste/copy/cut` at the shadow root (Pattern 2). This stops bubbling listeners only. **Capture-phase** listeners on `window`/`document` still run first and can't be blocked from a content script. If the manual Discord check still shows focus stealing, switch the panel to an extension-page iframe (the avatar stays in the Shadow DOM, selection capture stays in the content script, and the captured text goes to the iframe through `chrome.runtime` messaging).
**Warning signs:** The manual Discord check: open the preview, type „test”, and see whether the composer changes.

### Pitfall 4: bfcache revives the draft after Back navigation
**What goes wrong:** The child navigates away and presses Back, and the old draft is still there. That violates D-12 ("przejście na inną stronę w karcie kasuje szkic").
**Why it happens:** On a bfcache navigation the document is frozen, not destroyed. Back restores the same JS heap, and the content script is not re-injected `[CITED: developer.chrome.com/blog/bfcache-extension-messaging-changes]`.
**How to avoid:** Use `window.addEventListener('pagehide', reset)` to clear the draft, the hidden flag and the open view. `pagehide` carries no page content, so it is allowlisted in the D-04 test.

### Pitfall 5: "Extension context invalidated" after reloading the extension during development
**What goes wrong:** After clicking reload in `chrome://extensions`, avatars on already-open tabs throw on `chrome.runtime.sendMessage`.
**Why it happens:** Orphaned content scripts lose their runtime. MV3 doesn't re-inject static content scripts into existing tabs `[ASSUMED]`.
**How to avoid:** Catch in `submitCase` and show the "refresh" message. Always reload the demo tab after rebuilding. Note this in the demo checklist.

### Pitfall 6: Avatar covers Discord's composer or controls
**What goes wrong:** On the demo, the shark sits on top of the input or the send controls.
**How to avoid:** Start at bottom-right with `right: 24px; bottom: 96px`, which clears the composer row `[ASSUMED, verify visually]`. Allow dragging, clamp to the viewport on `pointermove` and on `resize`, and keep the panel inside the viewport (flip above or below and left or right of the avatar).

### Pitfall 7: Fake success in phase 1
**What goes wrong:** The confirmation says „Wysłano do opiekuna”, but nothing was sent.
**How to avoid:** Use neutral copy (Pattern 6). The guardian notice belongs in the **preview** (D-03), phrased as what will happen.

### Pitfall 8: Pages where content scripts can't run
**What goes wrong:** No avatar on `chrome://` pages, the Chrome Web Store, the new tab page or the PDF viewer. The icon click there throws "Receiving end does not exist".
**How to avoid:** Accept it (D-06 says "where Chrome allows"). Catch the error in `onActionClicked`. Optionally set `chrome.action.setBadgeText` / `setTitle` to say the helper doesn't work here.

## Code Examples

### Playwright extension fixture
```js
// tests/e2e/extension.fixture.mjs : Source: playwright.dev/docs/chrome-extensions (adapted)
import { test as base, chromium } from '@playwright/test';
import path from 'node:path';
const pathToExtension = path.resolve(import.meta.dirname, '../../dist');
export const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',                                   // headless extensions supported on this channel
      ...(process.env.AURA_CHROMIUM ? { executablePath: process.env.AURA_CHROMIUM } : {}), // e.g. /usr/bin/chromium
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    });
    await use(context);
    await context.close();
  },
  serviceWorker: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    await use(sw);
  },
});
export const expect = test.expect;
```
Fixture pages must be served over `http://127.0.0.1` (Playwright `webServer: { command: 'node tests/e2e/server.mjs', url: 'http://127.0.0.1:4173' }`). Content scripts don't run on `file://` unless the user enables "Allow access to file URLs" `[ASSUMED]`.

### E2E: selection to approval, with nothing sent before approval
```js
test('zaznaczenie → podgląd → zatwierdzenie; nic nie wysłane wcześniej', async ({ context, page, serviceWorker }) => {
  const requests = []; context.on('request', (r) => requests.push(r.url()));
  await page.goto('http://127.0.0.1:4173/chat-like.html');
  await page.locator('#msg').selectText();                                  // child selects the fake Nitro message
  await page.waitForTimeout(500);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0); // selection alone → nothing
  await page.getByRole('button', { name: /Scamerinio/ }).click();           // pierces the open shadow root
  const box = page.getByRole('textbox', { name: /Wiadomość/ });
  await expect(box).toHaveValue(/darmowe Nitro/i);
  expect(await serviceWorker.evaluate(() => self.__aura.messages.length)).toBe(0); // preview → nothing
  await box.fill('Darmowe Nitro! Kliknij link');                            // child removes own name
  await page.getByRole('button', { name: /Zatwierdzam/ }).click();
  await expect(page.getByText(/Gotowe/)).toBeVisible();
  const cases = await serviceWorker.evaluate(() => self.__aura.cases);
  expect(cases).toHaveLength(1);
  expect(cases[0]).toMatchObject({ content: 'Darmowe Nitro! Kliknij link', source: '127.0.0.1' });
  expect(requests.every((u) => u.startsWith('http://127.0.0.1:4173/') || u.startsWith('chrome-extension://'))).toBe(true);
});
```
A Playwright test **can't click the toolbar icon**. Test D-07 restore with `serviceWorker.evaluate(async () => { const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }); await self.__aura.onActionClicked(t); })` and assert the avatar is visible again `[ASSUMED, API shape is standard]`.

## Testing Strategy (D-04 proof)

`workflow.nyquist_validation` is `false` in `.planning/config.json`, so the formal Validation Architecture section is omitted. D-04 requires an automated proof anyway, built in three layers:

1. **Spy test (Vitest + happy-dom), `tests/unit/no-background-reading.test.js`.** Before importing `src/content/main.js`:
   - spy on `EventTarget.prototype.addEventListener`, `Document.prototype.getSelection` / `window.getSelection`, `globalThis.MutationObserver` (constructor), `globalThis.fetch`, `XMLHttpRequest.prototype.open`, `navigator.sendBeacon` and `WebSocket`;
   - stub `globalThis.chrome = { runtime: { sendMessage: vi.fn(), onMessage: { addListener: vi.fn() }, getURL: (p) => p, id: 'x' } }`.

   Then mount, put text on the page, select it and dispatch `selectionchange`/`mouseup`/`keyup`. Assert:
   - `getSelection` was called 0 times;
   - `sendMessage` 0 times; fetch, XHR, beacon, WebSocket and MutationObserver 0 times;
   - every `addEventListener` call on `window`/`document` uses a type in the allowlist `['pagehide', 'resize']`, and all other listeners are on nodes inside our host.

   Then dispatch `click` on the avatar: `getSelection` is called exactly once. Approve: `sendMessage` is called exactly once with type `aura/case-approved`. The happy-dom prototype-chain details for the `window` spy are `[ASSUMED]`. If spying on the prototype doesn't catch `window`, spy on `window.addEventListener` and `document.addEventListener` directly as well.
2. **Static source scan (Vitest, `fs`), `tests/unit/source-scan.test.js`:**
   - `getSelection` appears only in `src/content/capture.js`;
   - `chrome.runtime.sendMessage` appears only in `src/core/integration.js`;
   - none of `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `MutationObserver`, `selectionchange`, `chrome.storage`, `localStorage`, `sessionStorage`, `indexedDB`, `innerHTML`, `eval(`, `new Function` appear anywhere in `src/`;
   - `manifest.json` has no `storage` permission and no `host_permissions`.
3. **E2E (Playwright):** the service-worker message log stays empty through select → wait → open preview, has one entry after approval, and every network request belongs to the fixture origin (example above).
4. **Manual, human-verify at the end of the phase, on Discord web with a fictional account:**
   - the avatar is visible and doesn't cover the composer;
   - drag and hide work, and the toolbar icon restores the avatar;
   - select message, click the shark, see the preview, remove the name and approve;
   - **typing in the preview doesn't reach the Discord composer** (Pitfall 3);
   - a channel switch keeps the draft, while a reload and a Back navigation clear it.

Commands: `npm test` (Vitest, under 5 s), `npm run build && npm run test:e2e` (Playwright, under 30 s, headless).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MV2 background pages, `browserAction` | MV3 service worker, `chrome.action` | MV3 | The service worker is ephemeral, so keep no long-lived state there that matters beyond phase 1 |
| `--load-extension` in Google Chrome for tests | Branded Chrome/Edge removed side-load flags; use Playwright's Chromium (`channel: 'chromium'`) `[CITED: playwright.dev/docs/chrome-extensions]` | Chrome 137 era `[ASSUMED version]` | Don't point tests at Google Chrome. The local Arch `chromium` 152 **does** load unpacked MV3 headless `[VERIFIED: probe found a service_worker target chrome-extension://…/sw.js]` |
| bfcache evicted pages with open extension ports | Chrome 123+ closes ports and keeps the page in bfcache `[CITED: developer.chrome.com/blog/bfcache-extension-messaging-changes]` | Chrome 123 | Back restores the content-script heap. Hence Pitfall 4 |

**Deprecated/outdated:** MV2 extensions; `chrome.browserAction`; `document.execCommand('copy')` for clipboard reads (not needed; we never read the clipboard).

## Security Domain

ASVS level 1 (`security_asvs_level: 1`), `security_block_on: high`.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | None in phase 1 (demo profiles in phase 3, owned by `api-ui`) |
| V3 Session Management | no | — |
| V4 Access Control | partial | Service worker accepts messages only when `sender.id === chrome.runtime.id && sender.tab`. No `externally_connectable`. No `window.postMessage` listeners. |
| V5 Input Validation / Output Encoding | yes | `textContent`/`value` only (no `innerHTML`), 2000-char cap, link shown as text, never fetched or opened; enforced by the source-scan test |
| V6 Cryptography | no | — |
| V8 Data Protection | yes | Draft only in memory. No storage permission. No network in phase 1. `source` is the hostname only. |
| V10 Malicious Code / V14 Config | yes | No remote code, `eval` or `new Function` (MV3 forbids remote code). Minimal permissions (`activeTab`, `scripting`). `use_dynamic_url` on web-accessible resources. |

### Known Threat Patterns for an MV3 content-script widget
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Page reads the child's draft through `host.shadowRoot` (open mode) or composed `input`/`paste` events | Information disclosure | **Accepted for MVP.** The text came from that page or the clipboard, and the demo uses fictional data. A closed root would not help, because composed events and capture listeners still leak. The real fix is the iframe panel (v2 / fallback). Document this in the security notes. |
| Page spoofs messages to the extension | Spoofing | Listen only to `chrome.runtime.onMessage` and check the sender. Never `window.addEventListener('message')`. |
| Page overlays or clickjacks our UI (top-layer `<dialog>`/popover above max z-index) | Tampering | Accepted. Approval requires an explicit button press inside our shadow root. |
| XSS through selected or pasted content | Tampering | `textContent` only; static scan forbids `innerHTML` |
| Over-collection beyond D-02 | Information disclosure | Single read site, no DOM traversal, hostname instead of URL, spy and scan tests |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, tests | ✓ | v22.20.0 | — |
| npm | install | ✓ | 10.9.3 | — (pnpm not installed; use npm) |
| Chromium (system) | E2E, manual test | ✓ | 152.0.7977.82, loads unpacked MV3 headless (probed) | — |
| Playwright bundled Chromium | E2E (`channel:'chromium'`) | ✗ (not downloaded) | — | `npx playwright install chromium`, or `AURA_CHROMIUM=/usr/bin/chromium` via `executablePath` |
| Google Chrome (branded) | Demo browser | ✗ on this machine | — | Load unpacked through `chrome://extensions` → Developer mode on the demo machine (side-loading via UI still works; only the CLI flag was removed `[ASSUMED]`), or demo in Chromium |
| ImageMagick | Temporary or regenerated icons | ✓ | `/usr/bin/magick` | — |
| Display (headed runs) | Debugging E2E | ✓ | Wayland | Headless works |
| Discord account (fictional) | Manual check of D-05 | ? | — | Demo on the fixture "chat-like" page if Discord is unavailable |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Playwright browser download (use system Chromium); branded Chrome (use Chromium or load unpacked through the UI).

**Assets status (D-14):** `assets/widget-avatar/` now contains `avatar-master.png` (1024²), `avatar-128/64/48.png` and `icon-16/32/48/128.png`, all RGBA PNG `[VERIFIED: file(1) output]`. The 128 px avatar was viewed: a blue shark head with an orange siren and a transparent background. README line 42 warns verbatim: "dodatkowe ciasne przycięcie CSS do koła może uciąć płetwę", so don't crop it to a circle. The user still has to accept the art (D-14), so add a human-verify item. Build copies them; if the art is rejected, swap the files with no code change.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SPA `pushState` navigation keeps the same document and content-script instance, so the draft survives a channel switch | Pattern 5 | Low; covered by the manual Discord check |
| A2 | Programmatic `executeScript(files)` runs in the same isolated world as the static content script, so the DOM-marker guard prevents a double mount | Pattern 4 | Low; the guard reads the DOM marker, which works across worlds anyway |
| A3 | Discord's "type anywhere to focus composer" runs from bubbling-phase listeners that `stopPropagation` at the shadow root can block | Pitfall 3 | **Medium/High for the demo**; the fallback is the iframe panel (+2–3 h) |
| A4 | Default position `right:24px; bottom:96px` clears Discord's composer | Pitfall 6 | Low; draggable |
| A5 | happy-dom routes `window`/`document.addEventListener` through `EventTarget.prototype` (for the spy) | Testing Strategy | Low; spy on the instances directly too |
| A6 | Content scripts don't run on `file://` by default, so fixtures need an HTTP server | Code Examples | Low; the HTTP server is the recommended path anyway |
| A7 | `link`/`origin` fields and `source` = hostname are acceptable to `api-ui` in phase 3 | Pattern 6 | Low; phase 3 maps fields |
| A8 | Branded Chrome still allows "Load unpacked" through the UI in developer mode | Environment | Low; Chromium is a fallback demo browser |
| A9 | `@font-face` declared inside a shadow root is not applied | Pattern 2 | None; we use system fonts regardless |
| A10 | esbuild package name/provenance (training knowledge; registry verdict OK) | Package audit | Very low |
| A11 | Orphaned content scripts after an extension reload are not re-injected into existing tabs | Pitfall 5 | Low; dev-only annoyance |

## Open Questions (RESOLVED)

1. **A draft exists and the child selects new text, then clicks the avatar.** RESOLVED by the user as **D-17** (2026-10-03).
   - What we know: D-12 says the draft comes back on click. D-09 says a selection opens the preview with that selection.
   - What was unclear: which one wins.
   - Resolution: the draft comes back and a „Wstaw nowe zaznaczenie” button replaces it only on the child's click (D-17). Implemented in plan 01-04 Task 1 (`pendingSelection`, `insertPendingSelection`).
2. **Open vs closed shadow root.** RESOLVED: open mode, as an accepted risk (plan default).
   - What we know: open mode lets the page read the draft, but closed mode doesn't stop composed-event leakage, and Playwright can't pierce closed roots.
   - Resolution: `attachShadow({ mode: 'open' })` in plan 01-01 Task 2, accepted as threat T-01-06. The iframe panel is the fallback if the blocking Discord keyboard check at the end of the plan 01-01 tracer fails (Pitfall 3).
3. **Remember the dragged position?** RESOLVED: no stored position in phase 1 (plan default). The position lives in memory only and resets on reload, so the manifest keeps no `storage` permission and "the extension has no storage permission" stays a clean privacy claim. Implemented in plan 01-03 Task 1.
4. **Auto-fill the link field from a URL inside the selected text?** RESOLVED: yes, from the selected text only (plan default). `extractFirstLink` runs a regex on the selected text and never on DOM `href`s; pasted links come only from the link field, and the child can edit or clear the pre-filled link. Implemented in plan 01-04 Task 1.
5. **Demo browser:** RESOLVED by the user as **D-18** (2026-10-03): the demo runs in Google Chrome (load unpacked through the UI); E2E tests run on the local Chromium at `/usr/bin/chromium`. The Google Chrome load steps and the pre-demo checklist are in `projects/widget/README.md` (plan 01-04 Task 2).

## Sources

### Primary (HIGH confidence)
- Local probes this session (Chromium 152.0.7977.82 headless, raw CDP from Node 22): extension loading, selection survival per element type, textarea selection, `customElements === null` in the isolated world, page-CSP bypass for content-script `<style>` / `adoptedStyleSheets` / WAR image / `data:` image / extension iframe, open-root visibility to the page.
- `curl -I https://discord.com/channels/@me`: the live Discord CSP (`style-src … 'unsafe-inline'`, `img-src 'self' blob: data: …`, `font-src 'self' https://fonts.gstatic.com …`, `frame-src` without `chrome-extension:`).
- npm registry (`npm view`, gsd-tools package-legitimacy).
- Repo files read: `01-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `.planning/shared/README.md`, `.planning/shared/CONTRACT.md`, `.planning/PROJECT.md`, `.planning/config.json`, `assets/scamerino_palette.css`, `assets/widget-avatar/README.md`.

### Secondary (MEDIUM confidence)
- https://playwright.dev/docs/chrome-extensions : persistent context, `channel:'chromium'`, headless, service worker / extension ID
- https://playwright.dev/docs/locators : closed shadow roots unsupported
- https://developer.chrome.com/docs/extensions/reference/api/action : onClicked is not sent when a popup is set
- https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts : isolated worlds, `run_at`/`all_frames` defaults, injection permissions
- https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources : `use_dynamic_url`
- https://developer.chrome.com/blog/bfcache-extension-messaging-changes : bfcache and extension ports (Chrome 123)
- https://vitest.dev/config/environment : `environment: 'happy-dom'`

### Tertiary (LOW confidence)
- https://github.com/RaphaelRegnier/vibe-annotations/pull/89 : keyboard containment at the shadow host
- https://github.com/Popoboxxo/bluepencil/issues/32 : customElements null in content scripts (now also verified locally)
- Discord support community threads on chatbox auto-focus (behavior exists; implementation details unknown)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Versions come from the registry, and the choices are low-risk and well understood.
- Architecture: HIGH. Each critical mechanic was probed on the target browser engine.
- Pitfalls: MEDIUM-HIGH. Discord focus behavior (A3) is the main unverified item and is gated by a manual check plus a documented fallback.

**Research date:** 2026-10-03
**Valid until:** 2026-11-02 (stable platform). Re-check the package pins if installing after 2026-10-17.
