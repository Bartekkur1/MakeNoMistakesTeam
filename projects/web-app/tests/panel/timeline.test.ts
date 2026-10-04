// One timeline of state changes and comments (D-13): ascending created_at, a history entry before a
// comment on equal timestamps, then ascending id; each entry with its type word, author (plus
// "(Ty)" for the logged-in account), role and time; notes and comments as plain text.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { actorName, historyEntryBody, mergeTimeline } from "@/app/_panel/format";
import { Timeline } from "@/app/_panel/Timeline";
import { DEMO_CHILDREN } from "@/lib/contract/demo-accounts";
import type { HistoryEntry, ReportComment } from "@/lib/contract/types";
import { loadDemoDataset } from "../helpers/dataset";

const P1_ID = "00000000-0000-4000-8000-0000000a0001";
const T1_ID = "00000000-0000-4000-8000-0000000b0001";
const OLA_ID = "00000000-0000-4000-8000-0000000c0001";
const R1 = "00000000-0000-4000-8000-0000000d0001";
const R2 = "00000000-0000-4000-8000-0000000d0002";

function timelineOf(reportId: string): { history: HistoryEntry[]; comments: ReportComment[] } {
  const dataset = loadDemoDataset();
  return {
    history: dataset.history.filter((row) => row.report_id === reportId) as unknown as HistoryEntry[],
    comments: dataset.comments.filter((row) => row.report_id === reportId) as unknown as ReportComment[],
  };
}

const suffix = (id: string) => id.slice(-5);

function entry(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: "h",
    report_id: R2,
    action: "approve",
    from_state: "pending_parent",
    to_state: "with_teacher",
    actor_id: P1_ID,
    actor_role: "parent",
    comment: null,
    created_at: "2026-10-03T09:00:00.000Z",
    ...overrides,
  };
}

function comment(overrides: Partial<ReportComment>): ReportComment {
  return {
    id: "c",
    report_id: R2,
    author_id: T1_ID,
    author_role: "teacher",
    body: "Treść",
    created_at: "2026-10-03T09:00:00.000Z",
    ...overrides,
  };
}

describe("mergeTimeline", () => {
  it("interleaves R2's history and comments chronologically", () => {
    const { history, comments } = timelineOf(R2);

    const items = mergeTimeline(history, comments);

    expect(items.map((item) => suffix(item.id))).toEqual(["e0021", "e0022", "f0021", "e0023", "f0022", "e0024"]);
    expect(items.map((item) => item.kind)).toEqual(["history", "history", "comment", "history", "comment", "history"]);
  });

  it("puts a history entry before a comment with the same time, then orders by id, without mutating the input", () => {
    const history = [entry({ id: "z" })];
    const comments = [comment({ id: "b" }), comment({ id: "a" })];
    const historyCopy = [...history];
    const commentsCopy = [...comments];

    const items = mergeTimeline(history, comments);

    expect(items.map((item) => item.id)).toEqual(["z", "a", "b"]);
    expect(history).toEqual(historyCopy);
    expect(comments).toEqual(commentsCopy);
    expect(comments.map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("actorName", () => {
  it("names demo accounts and children without the demo suffix", () => {
    expect(actorName(P1_ID, "parent", [])).toBe("Mama Oli");
    expect(actorName(T1_ID, "teacher", [])).toBe("Wychowawczyni 5a");
    expect(actorName(OLA_ID, "child", [])).toBe("Ola");
  });

  it("falls back to the capitalized role label for an unknown id", () => {
    const unknown = "00000000-0000-4000-8000-0000000fffff";

    expect(actorName(unknown, "parent", [])).toBe("Rodzic");
    expect(actorName(unknown, "teacher", [])).toBe("Nauczyciel");
    expect(actorName(unknown, "child", [])).toBe("Dziecko");
  });

  it("finds a child outside the demo set among the session children", () => {
    const child = { ...DEMO_CHILDREN[0], id: "00000000-0000-4000-8000-0000000c0777", display_name: "Ala (smoke)" };

    expect(actorName(child.id, "child", [child])).toBe("Ala");
  });
});

describe("historyEntryBody", () => {
  it("describes the child's submit with the new state", () => {
    expect(historyEntryBody(entry({ action: "submit", from_state: null, to_state: "pending_parent" }))).toBe(
      "Dziecko przekazało zgłoszenie. Stan: „czeka na rodzica”.",
    );
  });

  it("describes a transition with both states", () => {
    expect(historyEntryBody(entry({ action: "approve", from_state: "pending_parent", to_state: "with_teacher" }))).toBe(
      "Zmiana z „czeka na rodzica” na „u nauczyciela”.",
    );
  });
});

describe("Timeline", () => {
  it("renders R2's entries with type words, authors, roles, notes and times", () => {
    const { history, comments } = timelineOf(R2);

    const html = renderToStaticMarkup(
      createElement(Timeline, { items: mergeTimeline(history, comments), sessionChildren: [], ownAccountId: P1_ID }),
    );

    expect(html).toContain("Zmiana stanu");
    expect(html).toContain("Komentarz");
    expect(html).toContain("Mama Oli (Ty)");
    expect(html).toContain("Wychowawczyni 5a");
    expect(html).not.toContain("Wychowawczyni 5a (Ty)");
    expect(html).toContain("Dziecko przekazało zgłoszenie. Stan: „czeka na rodzica”.");
    expect(html).toContain("Zmiana z „czeka na rodzica” na „u nauczyciela”.");
    expect(html.split("Notatka: ")).toHaveLength(3);
    expect(html).toContain('dateTime="2026-10-03T08:53:00.000Z"');
    expect(html).toContain("whitespace-pre-wrap");
    expect(html).toContain("[overflow-wrap:anywhere]");
    expect(html.split("<li")).toHaveLength(7);
    expect(html).not.toContain("(demo)");
    expect(html).not.toContain("<a ");
  });

  it("marks the teacher's own entries when the teacher is logged in", () => {
    const { history, comments } = timelineOf(R2);

    const html = renderToStaticMarkup(
      createElement(Timeline, { items: mergeTimeline(history, comments), sessionChildren: [], ownAccountId: T1_ID }),
    );

    expect(html).toContain("Wychowawczyni 5a (Ty)");
    expect(html).not.toContain("Mama Oli (Ty)");
  });

  it("offers comment actions only on the logged-in account's own comments", () => {
    const { history, comments } = timelineOf(R2);
    const commentActions = (c: ReportComment) => createElement("button", { "data-action": c.id }, "Usuń");

    const html = renderToStaticMarkup(
      createElement(Timeline, { items: mergeTimeline(history, comments), sessionChildren: [], ownAccountId: P1_ID, commentActions }),
    );

    const own = comments.filter((c) => c.author_id === P1_ID);
    expect(own.length).toBeGreaterThan(0);
    expect(html.split("data-action=")).toHaveLength(own.length + 1);
    for (const c of own) expect(html).toContain(`data-action="${c.id}"`);
  });

  it("renders a report with only the submit entry as one item without a note", () => {
    const { history, comments } = timelineOf(R1);

    const html = renderToStaticMarkup(
      createElement(Timeline, { items: mergeTimeline(history, comments), sessionChildren: [], ownAccountId: P1_ID }),
    );

    expect(html.split("<li")).toHaveLength(2);
    expect(html).toContain("Ola");
    expect(html).not.toContain("Notatka");
  });

  it("renders comment and note text as escaped plain text", () => {
    const items = mergeTimeline(
      [entry({ id: "h1", comment: "<i>uwaga</i> https://a.example" })],
      [comment({ id: "c1", body: "<script>x</script> https://b.example", created_at: "2026-10-03T09:05:00.000Z" })],
    );

    const html = renderToStaticMarkup(createElement(Timeline, { items, sessionChildren: [], ownAccountId: P1_ID }));

    expect(html).toContain("&lt;i&gt;uwaga&lt;/i&gt;");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<a ");
  });
});
