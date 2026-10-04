// Cross-cutting panel guardrails, inherited by every later panel file in phase 2:
// - server-secret boundary: panel code ships to every visitor, so it never imports server
//   modules or the Supabase SDK, never renders raw HTML, never logs, never sets cookies, and
//   only api.ts talks to the network and only session.ts touches browser storage (T-02-01..03);
// - D-02, D-06: no chain of runtime imports reaches the demo account list (e-mails and the login
//   code), directly or through the landing copy; tests/panel/bundle.test.ts checks the build output;
// - D-02: nothing in the panel copy marks the app as a presentation build, hints at the login
//   code or lists accounts;
// - D-03: there is no child-facing route; the only pages are the landing, /login, /panel and
//   /panel/[id].
// Sources are scanned with comments stripped, so explanatory comments never trip a rule.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import * as panelContent from "@/app/_panel/content";

const APP_DIR = join(process.cwd(), "src", "app");
const PANEL_DIRS = ["_panel", "login", "panel"].map((dir) => join(APP_DIR, dir));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function rel(path: string): string {
  return relative(process.cwd(), path).split(sep).join("/");
}

// Block comments, then line comments that are not part of a URL ("http://").
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

interface PanelFile {
  path: string;
  code: string;
}

const PANEL_FILES: PanelFile[] = PANEL_DIRS.flatMap(walk)
  .filter((path) => /\.(ts|tsx)$/.test(path))
  .map((path) => ({ path: rel(path), code: stripComments(readFileSync(path, "utf8")) }));

function importSpecifiers(code: string): string[] {
  const patterns = [
    /\b(?:import|export)\s[^;]*?\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  return patterns.flatMap((pattern) => [...code.matchAll(pattern)].map((match) => match[1]));
}

// Modules that hold the demo e-mails or the login code and so must never reach a client bundle.
const FORBIDDEN_IN_CLIENT = ["src/lib/contract/demo-accounts.ts", "src/app/_landing/content.ts"];

// Specifiers of imports that survive compilation: `import type` and `export type` are erased.
function runtimeImportSpecifiers(code: string): string[] {
  const withoutTypeOnly = code.replace(/\b(?:import|export)\s+type\s[^;]*?\bfrom\s*["'][^"']+["']/g, "");
  return importSpecifiers(withoutTypeOnly);
}

// The source file an "@/..." or relative specifier names, or null for a package import.
function resolveSpecifier(fromFile: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join(process.cwd(), "src", specifier.slice(2));
  else if (specifier.startsWith("./") || specifier.startsWith("../")) base = join(dirname(fromFile), specifier);
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")];
  return candidates.find((path) => existsSync(path) && statSync(path).isFile()) ?? null;
}

// The first import chain from `start` to a forbidden module, or null when none is reachable.
function chainTo(start: string, forbidden: ReadonlySet<string>): string[] | null {
  const seen = new Set<string>([start]);
  const queue: string[][] = [[start]];
  while (queue.length > 0) {
    const chain = queue.shift() as string[];
    const file = chain[chain.length - 1];
    if (forbidden.has(file)) return chain;
    for (const specifier of runtimeImportSpecifiers(stripComments(readFileSync(file, "utf8")))) {
      const next = resolveSpecifier(file, specifier);
      if (next === null || seen.has(next)) continue;
      seen.add(next);
      queue.push([...chain, next]);
    }
  }
  return null;
}

// Files (by repo-relative path) whose code matches the pattern.
function offenders(pattern: RegExp, files: PanelFile[] = PANEL_FILES): string[] {
  return files.filter((file) => pattern.test(file.code)).map((file) => file.path);
}

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings);
  return [];
}

describe("panel guardrails", () => {
  it("scans the panel sources", () => {
    const paths = PANEL_FILES.map((file) => file.path);

    expect(paths).toContain("src/app/_panel/api.ts");
    expect(paths).toContain("src/app/_panel/session.ts");
    expect(paths).toContain("src/app/login/page.tsx");
    expect(paths).toContain("src/app/panel/page.tsx");
  });

  it("(a) never imports a server module or the Supabase SDK", () => {
    const forbidden = /(^|\/)lib\/server(\/|$)|^@supabase\/|^server-only$|^node:/;
    const bad = PANEL_FILES.flatMap((file) =>
      importSpecifiers(file.code)
        .filter((specifier) => forbidden.test(specifier))
        .map((specifier) => `${file.path} imports ${specifier}`),
    );

    expect(bad).toEqual([]);
  });

  it("(a) never imports the demo account list or the landing copy that re-exports it", () => {
    const forbidden = /(^|\/)contract\/demo-accounts$|(^|\/)_landing\/content$/;
    const bad = PANEL_FILES.flatMap((file) =>
      importSpecifiers(file.code)
        .filter((specifier) => forbidden.test(specifier))
        .map((specifier) => `${file.path} imports ${specifier}`),
    );

    expect(bad).toEqual([]);
  });

  it("(a) never reaches the demo account list through any chain of runtime imports", () => {
    // Panel code ships to every visitor. The bundler keeps a whole imported module in the client
    // chunk, so a module that is reachable at all leaks every e-mail and the login code (D-02, D-06).
    const forbidden = new Set(FORBIDDEN_IN_CLIENT.map((path) => join(process.cwd(), path)));
    const bad = PANEL_FILES.flatMap((file) => {
      const chain = chainTo(join(process.cwd(), file.path), forbidden);
      return chain ? [chain.map(rel).join(" -> ")] : [];
    });

    expect(bad).toEqual([]);
  });

  it("(b) never renders raw HTML, logs to the console or touches cookies", () => {
    expect(offenders(/dangerouslySetInnerHTML/)).toEqual([]);
    expect(offenders(/\binnerHTML\b/)).toEqual([]);
    expect(offenders(/\bconsole\s*\./)).toEqual([]);
    expect(offenders(/\bdocument\s*\.\s*cookie\b/)).toEqual([]);
  });

  it("(c) calls the network only from api.ts and browser storage only from session.ts", () => {
    expect(offenders(/\bfetch\s*\(/).filter((path) => path !== "src/app/_panel/api.ts")).toEqual([]);
    expect(offenders(/\b(localStorage|sessionStorage)\b/).filter((path) => path !== "src/app/_panel/session.ts")).toEqual(
      [],
    );
  });

  it("(d) never writes the token into a query string", () => {
    const api = PANEL_FILES.filter((file) => file.path === "src/app/_panel/api.ts");

    expect(api).toHaveLength(1);
    expect(offenders(/[?&][\w-]*token[\w-]*=/i, api)).toEqual([]);
    expect(offenders(/searchParams\s*\.\s*(set|append)\s*\(\s*["'`][^"'`]*token/i, api)).toEqual([]);
    expect(offenders(/URLSearchParams\s*\([^)]*\btoken\b/i, api)).toEqual([]);
  });

  it("(e) never imports the login code, the account list or the landing panel and footer copy", () => {
    expect(offenders(/\bDEMO_LOGIN_CODE\b|\bpresentableDemoAccounts\b/)).toEqual([]);

    const landingImports = PANEL_FILES.flatMap((file) =>
      [...file.code.matchAll(/\bimport\s+([^;]*?)\s+from\s*["']@\/app\/_landing\/content["']/g)].map((match) => ({
        path: file.path,
        clause: match[1],
      })),
    );
    const bad = landingImports
      .filter(({ clause }) => clause.includes("*") || /\b(PANEL|FOOTER)\b/.test(clause))
      .map(({ path, clause }) => `${path}: import ${clause}`);

    expect(bad).toEqual([]);
  });

  it("writes panel copy without em dashes, dash-joined clauses or any presentation marking", () => {
    const strings = allStrings(panelContent);

    expect(strings.length).toBeGreaterThan(0);
    expect(strings.filter((text) => text.includes("—"))).toEqual([]);
    expect(strings.filter((text) => text.includes(" - "))).toEqual([]);
    expect(strings.filter((text) => /demo/i.test(text))).toEqual([]);
    expect(strings.filter((text) => text.includes("0000"))).toEqual([]);
    expect(strings.filter((text) => text.includes("(smoke)"))).toEqual([]);
  });

  it("has no child-facing route: only the landing, login, panel and report pages exist", () => {
    const allowed = ["page.tsx", "login/page.tsx", "panel/page.tsx", "panel/[id]/page.tsx"];
    const pages = walk(APP_DIR)
      .filter((path) => !rel(path).startsWith("src/app/api/"))
      .filter((path) => /(^|\/)page\.(tsx|ts|jsx|js|mdx)$/.test(rel(path)))
      .map((path) => relative(APP_DIR, path).split(sep).join("/"));

    expect(pages.filter((page) => !allowed.includes(page))).toEqual([]);
    expect(pages).toContain("page.tsx");
    expect(pages).toContain("login/page.tsx");
    expect(pages).toContain("panel/page.tsx");
  });
});
