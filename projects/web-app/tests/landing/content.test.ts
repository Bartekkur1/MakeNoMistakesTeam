import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as content from "@/app/_landing/content";
import {
  CHROME_EXTENSIONS_PAGE,
  EXTENSION_DOWNLOAD_URL,
  FAQ,
  HONEST_EXAMPLE,
  INSTALL,
  MISSION_VIDEO,
  NAV_LINKS,
  PLUGIN_SCREENSHOT,
  RELEASES_URL,
  SCAMS,
  SECTION_IDS,
  SOURCES,
  STAT_PAIRS,
  TRAINING_FACT,
  presentableDemoAccounts,
} from "@/app/_landing/content";

// Every string reachable from the content module's exports.
function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings);
  return [];
}

describe("landing content", () => {
  it("hides smoke-test accounts and keeps 3 parents and 2 teachers", () => {
    const accounts = presentableDemoAccounts();

    expect(accounts.some((account) => account.display_name.includes("(smoke)"))).toBe(false);
    expect(accounts.filter((account) => account.role === "parent")).toHaveLength(3);
    expect(accounts.filter((account) => account.role === "teacher")).toHaveLength(2);
  });

  it("cites a listed source for every stat pair and the training fact", () => {
    const sourceIds = SOURCES.map((source) => source.id);

    expect(STAT_PAIRS).toHaveLength(2);
    for (const pair of STAT_PAIRS) {
      expect(sourceIds).toContain(pair.sourceId);
      expect(pair.first.value.trim()).not.toBe("");
      expect(pair.second.value.trim()).not.toBe("");
    }
    expect(sourceIds).toContain(TRAINING_FACT.sourceId);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
  });

  it("numbers sources from 1 so footnotes match the footer list", () => {
    expect(SOURCES.map((source) => source.id)).toEqual(SOURCES.map((_, index) => index + 1));
    for (const source of SOURCES) {
      expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it("reports the parent figure as a confirmation rate, not a share of cases", () => {
    const [incidents] = STAT_PAIRS;

    expect(incidents.first.label).toContain("e-mail lub w serwisie społecznościowym (12%)");
    expect(incidents.first.label).toContain("kradzieży przedmiotów w grach (8%)");
    expect(incidents.second).toEqual({ value: "13%", label: "rodziców potwierdza takie zdarzenie" });
  });

  it("shows five scam examples with signals and a next step, plus one honest message", () => {
    expect(SCAMS).toHaveLength(5);
    for (const scam of SCAMS) {
      expect(scam.message.trim()).not.toBe("");
      expect(scam.signals.length).toBeGreaterThanOrEqual(2);
      expect(scam.action.trim()).not.toBe("");
    }
    expect(HONEST_EXAMPLE.message.trim()).not.toBe("");
  });

  it("downloads the extension zip from the latest GitHub release", () => {
    expect(RELEASES_URL).toBe("https://github.com/Bartekkur1/MakeNoMistakesTeam/releases");
    expect(EXTENSION_DOWNLOAD_URL).toBe(`${RELEASES_URL}/latest/download/bezpiecznaaura-wtyczka.zip`);
  });

  it("answers every FAQ question", () => {
    expect(FAQ.items).toHaveLength(6);
    for (const item of FAQ.items) {
      expect(item.question.trim()).not.toBe("");
      expect(item.answer.trim()).not.toBe("");
    }
  });

  it("shows chrome://extensions as copyable text in exactly one install step", () => {
    const stepsWithCode = INSTALL.steps.filter((step) => step.code !== undefined);

    expect(INSTALL.steps).toHaveLength(5);
    expect(stepsWithCode).toEqual([expect.objectContaining({ code: CHROME_EXTENSIONS_PAGE })]);
    expect(CHROME_EXTENSIONS_PAGE).toBe("chrome://extensions");
  });

  it("points every nav link at a section anchor", () => {
    const anchors = Object.values(SECTION_IDS).map((id) => `#${id}`);

    expect(NAV_LINKS).toHaveLength(4);
    for (const link of NAV_LINKS) {
      expect(anchors).toContain(link.href);
    }
  });

  it("writes copy without em dashes or dash-joined clauses", () => {
    const strings = allStrings(content);

    expect(strings.filter((text) => text.includes("—"))).toEqual([]);
    expect(strings.filter((text) => text.includes(" - "))).toEqual([]);
  });

  it("does not promise a mobile page that does not exist yet", () => {
    const mobileAnswer = FAQ.items.find((item) => item.question.includes("urządzeniach"));

    expect(mobileAnswer?.answer).toContain("przygotowujemy");
  });

  it("ships the plugin screenshot and the Roblox mission video from public/", () => {
    const publicFile = (src: string) => join(process.cwd(), "public", src);

    for (const src of [PLUGIN_SCREENSHOT.src, MISSION_VIDEO.src, MISSION_VIDEO.poster]) {
      expect(existsSync(publicFile(src))).toBe(true);
    }
    expect(PLUGIN_SCREENSHOT.alt.trim()).not.toBe("");
    expect(MISSION_VIDEO.caption.trim()).not.toBe("");
  });
});
