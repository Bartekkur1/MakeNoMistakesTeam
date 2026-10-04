// Row text rules (UI-SPEC "Formatting helpers"): Polish dates in the Europe/Warsaw zone (also
// across midnight), the 140-character list excerpt, the child-name fallback, the row meta line,
// the small template and link helpers, and the risk marker (D-04, D-10): "kliknięcie, podanie
// danych, zapłata" only, in that order.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RiskBadge } from "@/app/_panel/badges";
import { reportHref } from "@/app/_panel/content";
import {
  actorName,
  childName,
  displayName,
  excerpt,
  fillTemplate,
  formatClock,
  formatDateTime,
  isRiskyAction,
  riskCategories,
  riskLabel,
  rowMeta,
} from "@/app/_panel/format";
import { CHILD_NAMES, PERSON_NAMES } from "@/app/_panel/names";
import { DEMO_ACCOUNTS, DEMO_CHILDREN } from "@/lib/contract/demo-accounts";
import type { ChildInfo, Report, TakenAction } from "@/lib/contract/types";
import { loadDemoDataset } from "../helpers/dataset";

const reports = loadDemoDataset().reports as unknown as Report[];

function report(n: number): Report {
  const found = reports.find((row) => row.id === `00000000-0000-4000-8000-0000000d000${n}`);
  if (!found) throw new Error(`R${n} missing from the demo dataset`);
  return found;
}

describe("panel row formatting", () => {
  it("formats dates and clock times in Polish for Europe/Warsaw, also across midnight", () => {
    expect(formatDateTime("2026-10-03T08:40:00.000Z")).toBe("3 paź 2026, 10:40");
    expect(formatDateTime("2026-01-15T23:30:00.000Z")).toBe("16 sty 2026, 00:30");
    expect(formatClock(new Date("2026-10-03T08:05:00.000Z"))).toBe("10:05");
  });

  it("keeps a 140-character message whole, cuts a longer one at 140 plus an ellipsis and collapses whitespace", () => {
    const r1 = report(1).content;
    const r2 = report(2).content;
    expect(r1).toHaveLength(140);
    expect(r2).toHaveLength(163);

    expect(excerpt(r1)).toBe(r1);
    const cut = excerpt(r2);
    expect(cut).toHaveLength(141);
    expect(cut.endsWith("…")).toBe(true);
    expect(excerpt("a\n\n  b")).toBe("a b");
  });

  it("names the child from the demo children, then the session children, else the neutral fallback", () => {
    const sessionChild: ChildInfo = {
      id: "00000000-0000-4000-8000-0000000c00ff",
      display_name: "Nowe (demo)",
      parent_id: "00000000-0000-4000-8000-0000000a0001",
      class_id: "class-5a",
    };

    expect(childName("00000000-0000-4000-8000-0000000c0001", [])).toBe("Ola");
    expect(childName(sessionChild.id, [sessionChild])).toBe("Nowe");
    expect(childName("00000000-0000-4000-8000-0000000c0fff", [])).toBe("Dziecko");
    expect(rowMeta(report(4), [])).toBe("Kuba · Discord · fałszywa nagroda lub konkurs");
  });

  it("keeps the client-safe name map in step with the demo accounts and children (CR-01)", () => {
    expect([...PERSON_NAMES]).toEqual(DEMO_ACCOUNTS.map((account) => [account.id, displayName(account.display_name)]));
    expect([...CHILD_NAMES]).toEqual(DEMO_CHILDREN.map((child) => [child.id, displayName(child.display_name)]));
    const names = [...PERSON_NAMES.values(), ...CHILD_NAMES.values()];
    expect(names.filter((name) => name.includes("@") || /\((demo|smoke)\)/.test(name))).toEqual([]);
  });

  it("never resolves an inherited object key as a name", () => {
    expect(childName("constructor", [])).toBe("Dziecko");
    expect(actorName("__proto__", "teacher", [])).toBe("Nauczyciel");
  });

  it("fills {key} templates and encodes the report id in the detail link", () => {
    expect(fillTemplate("Odświeżono {time}", { time: "10:05" })).toBe("Odświeżono 10:05");
    expect(reportHref("a/b")).toBe("/panel/a%2Fb");
  });
});

describe("panel risk marker", () => {
  it("names the risk categories present, in the order kliknięcie, podanie danych, zapłata", () => {
    expect(riskCategories(["clicked_link", "shared_personal_data"])).toEqual(["kliknięcie", "podanie danych"]);
    expect(riskCategories(["paid", "entered_password"])).toEqual(["podanie danych", "zapłata"]);
    expect(riskCategories(["downloaded_file", "replied"])).toEqual([]);
    expect(riskCategories([])).toEqual([]);
  });

  it("builds the badge text, or nothing when no risky action was taken", () => {
    expect(riskLabel(["clicked_link", "shared_personal_data"])).toBe("Ryzyko: kliknięcie, podanie danych");
    expect(riskLabel(["replied"])).toBeNull();
  });

  it("counts clicking, giving data and paying as risky, but not a download or a reply", () => {
    const risky: TakenAction[] = ["clicked_link", "entered_password", "shared_code", "shared_personal_data", "paid"];
    const notRisky: TakenAction[] = ["downloaded_file", "replied"];

    expect(risky.map(isRiskyAction)).toEqual(risky.map(() => true));
    expect(notRisky.map(isRiskyAction)).toEqual([false, false]);
  });

  it("renders the crimson badge with a decorative dot, and nothing without risk", () => {
    const html = renderToStaticMarkup(createElement(RiskBadge, { actions: ["clicked_link"] }));

    expect(html).toContain("Ryzyko: kliknięcie");
    expect(html).toContain("bg-hook-crimson/10");
    expect(html).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(createElement(RiskBadge, { actions: ["replied"] }))).toBe("");
  });
});
