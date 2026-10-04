// The canonical demo data and published contract examples (.planning/shared/examples), read
// from disk so tests compare the API against the very files clients rely on.

import { readFileSync } from "node:fs";
import { fakeSupabase, type Row } from "./fake-supabase";

export interface ExampleFile {
  description: string;
  method: string;
  route: string;
  path: string;
  auth: { email: string; scope: "panel" | "extension" } | null;
  request: unknown;
  response: { status: number; body: unknown };
}

export interface DemoDataset {
  reports: Row[];
  history: Row[];
  comments: Row[];
}

const EXAMPLES_DIR = new URL("../../../../.planning/shared/examples/", import.meta.url);

export function loadExample<T = ExampleFile>(name: string): T {
  return JSON.parse(readFileSync(new URL(name, EXAMPLES_DIR), "utf8")) as T;
}

export function loadDemoDataset(): DemoDataset {
  return loadExample<{ dataset: DemoDataset }>("demo-dataset.json").dataset;
}

// Resets the fake with the 6 demo reports, 13 history entries and 3 comments; history and
// comments get their seq in file order (as seed.sql inserts them one statement per row).
export function seedFakeWithDataset(extraReports: Row[] = []): DemoDataset {
  const dataset = loadDemoDataset();
  fakeSupabase.reset({
    reports: [...dataset.reports, ...extraReports],
    report_history: dataset.history.map((row, index) => ({ ...row, seq: index + 1 })),
    report_comments: dataset.comments.map((row, index) => ({ ...row, seq: index + 1 })),
  });
  return dataset;
}
