// Post-build guardrail (D-02, D-06): the JavaScript the browser downloads never contains a demo
// account e-mail (they all share one domain), the login code constant or the demo name markers.
// The source guardrail (guardrails.test.ts) checks imports; this one checks what the bundler
// actually emitted. It runs only when `next build` output exists in .next/static and skips
// otherwise. After changing panel code, run `npm run build` again before trusting this result: an
// older build is checked as it is. Only file paths are reported, never the matched text.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_EMAIL_DOMAIN } from "@/lib/contract/demo-accounts";

const STATIC_DIR = join(process.cwd(), ".next", "static");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function rel(path: string): string {
  return relative(process.cwd(), path).split(sep).join("/");
}

const MARKERS: readonly { name: string; text: string }[] = [
  { name: "account e-mail domain", text: `@${DEMO_EMAIL_DOMAIN}` },
  { name: "login code constant", text: "DEMO_LOGIN_CODE" },
  { name: "demo name marker", text: "(demo)" },
  { name: "smoke name marker", text: "(smoke)" },
];

describe.skipIf(!existsSync(STATIC_DIR))("client bundle (after next build)", () => {
  it("ships no demo account e-mail, login code or demo name marker in any client chunk", () => {
    const chunks = walk(STATIC_DIR)
      .filter((path) => path.endsWith(".js"))
      .map((path) => ({ path: rel(path), code: readFileSync(path, "utf8") }));

    expect(chunks.length).toBeGreaterThan(0);
    const bad = chunks.flatMap((chunk) =>
      MARKERS.filter((marker) => chunk.code.includes(marker.text)).map((marker) => `${chunk.path}: ${marker.name}`),
    );
    expect(bad).toEqual([]);
  });
});
