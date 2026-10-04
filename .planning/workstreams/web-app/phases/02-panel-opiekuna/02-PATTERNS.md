# Phase 2: Panel opiekuna - Pattern Map

**Mapped:** 2026-10-03
**Files analyzed:** 13 (new + modified)
**Analogs found:** 10 / 13 (no client component or client data fetching exists yet)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `web-app/src/app/layout.tsx` (MODIFY: Unbounded weight 600) | config/layout | n/a | itself, line 9 | exact |
| `web-app/src/app/_panel/styles.ts` | utility (class strings) | n/a | `web-app/src/app/_landing/styles.ts` | exact |
| `web-app/src/app/_panel/content.ts` | config (PL copy) | n/a | `web-app/src/app/_landing/content.ts` | exact |
| `web-app/src/app/_panel/format.ts` (displayName, dates, risk categories) | utility | transform | `web-app/src/lib/contract/workflow.ts` (pure fns over contract types) | role-match |
| `web-app/src/app/_panel/api.ts` (fetch client, Bearer, error envelope, 401/409) | service (client) | request-response | none client-side; contract shape from `web-app/src/app/api/reports/route.ts` | partial |
| `web-app/src/app/_panel/session.ts` (token storage, expiry, guard hook) | store/hook | event-driven | none | no analog |
| `web-app/src/app/_panel/PanelHeader.tsx` (shell: logo, logout) | component | n/a | `web-app/src/app/_landing/SiteHeader.tsx` | exact |
| `web-app/src/app/login/page.tsx` (+ client form) | route/component | request-response | `web-app/src/app/page.tsx` + SiteHeader | partial |
| `web-app/src/app/panel/layout.tsx` (guard + shell, `bg-ice-surface`) | layout | n/a | `web-app/src/app/layout.tsx` | role-match |
| `web-app/src/app/panel/page.tsx` (list, "Pokaż więcej", Odśwież, filter) | route/component | request-response (paginated) | none client-side | no analog |
| `web-app/src/app/panel/[id]/page.tsx` (detail, timeline, action dialog, comment) | route/component | request-response | none client-side | no analog |
| `web-app/tests/panel/content.test.ts` | test | n/a | `web-app/tests/landing/content.test.ts` | exact |
| `web-app/tests/panel/format.test.ts` (and api helper tests) | test | transform | `web-app/tests/lib/workflow.test.ts` | exact |

## Hard boundary

Panel code (`src/app/_panel/*`, `src/app/login/*`, `src/app/panel/*`) imports only from `@/lib/contract/*` (`types.ts`, `workflow.ts`, `demo-accounts.ts`) and `@/app/_landing/styles` / `content`. It must NEVER import `@/lib/server/*` (Supabase client, `DEMO_AUTH_SECRET`). A test can enforce this by grepping panel source files for `lib/server`. Files using hooks/localStorage need `"use client"` (none exist yet; check `web-app/node_modules/next/dist/docs/` for Next 16 client components, `useRouter` from `next/navigation`, and `params` as a Promise / `useParams` in dynamic routes).

## Pattern Assignments

### `web-app/src/app/layout.tsx` (modify)
Line 9: `weight: ["500", "700"],` -> `weight: ["500", "600", "700"],` (UI-SPEC A2). Nothing else changes. Note `LayoutProps<"/">` typing (line 23) - reuse `LayoutProps<"/panel">` in the panel layout.

### `web-app/src/app/_panel/styles.ts`
**Analog:** `web-app/src/app/_landing/styles.ts` lines 1-11
```ts
const buttonBase =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue";
export const primaryButton = `${buttonBase} bg-shark-blue text-white hover:bg-shark-blue-dark`;
export const buttonLarge = "h-12 px-6";
export const buttonSmall = "h-10 px-4 text-sm";
```
Import `primaryButton`, `buttonSmall`, `buttonLarge`, `textLink` from `@/app/_landing/styles` (do not edit that file); add `secondaryButton`, `inputBase`, `textareaBase`, `card`, `badgeBase` exactly as in UI-SPEC table (lines ~61-71), plus `disabled:cursor-not-allowed disabled:opacity-60` for a panel primary button variant. Comment style: one short line comment above each group.

### `web-app/src/app/_panel/content.ts`
**Analog:** `web-app/src/app/_landing/content.ts` (plain `export const` objects/strings; `LOGIN_HREF = "/login"` at line 13 - reuse it, do not redefine). Copy rule: no em dash and no " - " joining clauses (enforced by `tests/landing/content.test.ts`). Contract labels (`*_LABELS_PL`, `API_ERROR_MESSAGES_PL`) are imported from `@/lib/contract/types`, never duplicated. No demo hints (D-02).

### `web-app/src/app/_panel/format.ts`
**Analog:** `web-app/src/lib/contract/workflow.ts` (lines 20, 33: small pure exported functions typed with contract types).
```ts
export function availableActions(state: ReportState, role: AccountRole): TransitionAction[] {
```
Inputs: `TAKEN_ACTIONS`/`TakenAction` (types.ts:85-96) for risk categories (click / data / payment), `DEMO_CHILDREN` (demo-accounts.ts:61) and `findDemoAccountById` (demo-accounts.ts:106) for names. Keep pure so vitest `environment: "node"` can test it.

### `web-app/src/app/_panel/api.ts`
No client fetch exists. Contract to follow, from routes:
- `POST /api/auth/login` body `{ email, code, scope: "panel" }`; `GET /api/auth/me`.
- `GET /api/reports?limit=&cursor=&state=` -> `{ items, next_cursor }` (see `web-app/src/app/api/reports/route.ts` comment lines ~38-40 and `.planning/shared/examples/`).
- `GET /api/reports/[id]`, `POST /api/reports/[id]/transitions`, `POST /api/reports/[id]/comments`.
- Errors: envelope `{ error: { code, message } }`; codes `API_ERROR_CODES` / `API_ERROR_HTTP_STATUS` in `types.ts:186-200`. Map 401 -> clear session + `router.replace("/login")` with message (D-07); 409 -> "Sprawa zmieniła się w międzyczasie" + refetch (D-15); 503 `storage_unavailable` -> error, never fake success.
- `Authorization: Bearer <token>` header; never put token or e-mail in URL. Same origin, no CORS.
Return a discriminated result `{ ok: true, value } | { ok: false, ... }`, mirroring the `auth.ok` / `body.ok` style used in `route.ts` lines 20-24.

### `web-app/src/app/_panel/PanelHeader.tsx`
**Analog:** `web-app/src/app/_landing/SiteHeader.tsx` lines 1-30
```tsx
import Image from "next/image";
...
<header className="sticky top-0 z-20 border-b border-titanium-border bg-white/95 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
    <a href="#" className="flex items-center gap-2 font-display text-base font-bold text-navy-slate">
      <Image src="/scamerino-head-128.png" alt="" width={40} height={40} className="h-10 w-10" />
      BezpiecznaAura
    </a>
    ...
    <a href={LOGIN_HREF} className={`${primaryButton} ${buttonSmall}`}>Zaloguj się</a>
```
Change: logo links to `/panel`; right side shows account name/role (`ACCOUNT_ROLE_LABELS_PL`) and a "Wyloguj" `secondaryButton` button (client component). Named export function, no default export (landing convention).

### `web-app/src/app/login/page.tsx`, `web-app/src/app/panel/layout.tsx`, `panel/page.tsx`, `panel/[id]/page.tsx`
**Analog (structure only):** `web-app/src/app/page.tsx` composes `_landing` components; route files stay thin and delegate to components in `_panel/`. Guard: `/panel*` without session -> `router.replace("/login")`; `/login` with session -> `router.replace("/panel")`; render "Wczytywanie panelu…" until confirmed (UI-SPEC line ~450). Login steps 1/2 are the same route with local state (D-05, D-06). Detail buttons from `availableActions(report.state, account.role)`; comment required when `TRANSITION_COMMENT_REQUIRED[action]` (types.ts:174).

### `web-app/tests/panel/*.test.ts`
**Analogs:** `web-app/tests/landing/content.test.ts` (lines 1-40: imports via `@/app/...`, `allStrings()` walker to assert copy rules), `web-app/tests/lib/workflow.test.ts` (lines 1-25: header comment explaining intent, imports from `@/lib/contract/*`, hand-written expectations). vitest config: `environment: "node"`, `include: ["tests/**/*.test.ts"]`, `@` alias -> `src` (`web-app/vitest.config.ts`). No DOM/jsdom: test pure modules (`content.ts`, `format.ts`, api result mapping with a stubbed `fetch`), not React rendering.

## Shared Patterns

- **Contract import, never copy:** `@/lib/contract/types`, `@/lib/contract/workflow`, `@/lib/contract/demo-accounts`.
- **Styling:** Tailwind 4 `@theme` tokens in `web-app/src/app/globals.css` (no tailwind.config); colors `shark-blue`, `hook-crimson`, `siren-amber`, `ice-surface`, `titanium-border`, `navy-slate`, `muted-slate`; tints via opacity modifiers (`bg-hook-crimson/10`).
- **Copy rule:** no em dash / " - " clause joins in panel-authored strings; contract labels shown verbatim.
- **Comments:** short leading `//` comment citing decision IDs (e.g. `// D-12`), as in route and test files.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `_panel/session.ts` | store/hook | event-driven | No client state/localStorage code in repo |
| `panel/page.tsx` | client page | paginated request-response | No client-side data fetching exists |
| `panel/[id]/page.tsx` | client page + dialog | request-response | Same; use Next 16 docs in `web-app/node_modules/next/dist/docs/` |

## Metadata

**Analog search scope:** `web-app/src/app`, `web-app/src/lib/contract`, `web-app/tests`, `web-app/vitest.config.ts`
**Files scanned:** ~15
**Pattern extraction date:** 2026-10-03
