// Hardcoded demo accounts, children and classes (CONTEXT D-14). Contract version 2.
// Fictional data only: every e-mail ends in "@bezpiecznaaura.example" and every name is marked
// "(demo)" or "(smoke)". The smoke accounts exist only for the live smoke test (plan 01-06)
// and are never used in the presentation.
//
// Erasable TypeScript only, and only `import type` from "./types":
// web-app/scripts/check-contract-examples.mjs loads this file through Node type stripping.

import type { AccountInfo, AccountRole, ChildInfo } from "./types";

// In theory the code arrives by e-mail; in the demo it is always 0000.
export const DEMO_LOGIN_CODE = "0000";

export const DEMO_EMAIL_DOMAIN = "bezpiecznaaura.example";

export const DEMO_ACCOUNTS: readonly AccountInfo[] = [
  {
    id: "00000000-0000-4000-8000-0000000a0001",
    email: "rodzic.ola@bezpiecznaaura.example",
    role: "parent",
    display_name: "Mama Oli (demo)",
  },
  {
    id: "00000000-0000-4000-8000-0000000a0002",
    email: "rodzic.kuba@bezpiecznaaura.example",
    role: "parent",
    display_name: "Tata Kuby (demo)",
  },
  {
    id: "00000000-0000-4000-8000-0000000a0003",
    email: "rodzic.zosia@bezpiecznaaura.example",
    role: "parent",
    display_name: "Mama Zosi (demo)",
  },
  {
    id: "00000000-0000-4000-8000-0000000a0009",
    email: "rodzic.test@bezpiecznaaura.example",
    role: "parent",
    display_name: "Rodzic testowy (smoke)",
  },
  {
    id: "00000000-0000-4000-8000-0000000b0001",
    email: "nauczyciel.5a@bezpiecznaaura.example",
    role: "teacher",
    display_name: "Wychowawczyni 5a (demo)",
  },
  {
    id: "00000000-0000-4000-8000-0000000b0002",
    email: "nauczyciel.6b@bezpiecznaaura.example",
    role: "teacher",
    display_name: "Wychowawca 6b (demo)",
  },
  {
    id: "00000000-0000-4000-8000-0000000b0009",
    email: "nauczyciel.test@bezpiecznaaura.example",
    role: "teacher",
    display_name: "Nauczyciel testowy (smoke)",
  },
];

export const DEMO_CHILDREN: readonly ChildInfo[] = [
  {
    id: "00000000-0000-4000-8000-0000000c0001",
    display_name: "Ola (demo)",
    parent_id: "00000000-0000-4000-8000-0000000a0001",
    class_id: "class-5a",
  },
  {
    id: "00000000-0000-4000-8000-0000000c0002",
    display_name: "Kuba (demo)",
    parent_id: "00000000-0000-4000-8000-0000000a0002",
    class_id: "class-5a",
  },
  {
    id: "00000000-0000-4000-8000-0000000c0003",
    display_name: "Zosia (demo)",
    parent_id: "00000000-0000-4000-8000-0000000a0003",
    class_id: "class-6b",
  },
  {
    id: "00000000-0000-4000-8000-0000000c0009",
    display_name: "Dziecko testowe (smoke)",
    parent_id: "00000000-0000-4000-8000-0000000a0009",
    class_id: "class-test",
  },
];

export interface DemoClass {
  id: string;
  name: string;
  teacher_id: string;
}

export const DEMO_CLASSES: readonly DemoClass[] = [
  { id: "class-5a", name: "Klasa 5a (demo)", teacher_id: "00000000-0000-4000-8000-0000000b0001" },
  { id: "class-6b", name: "Klasa 6b (demo)", teacher_id: "00000000-0000-4000-8000-0000000b0002" },
  { id: "class-test", name: "Klasa testowa (smoke)", teacher_id: "00000000-0000-4000-8000-0000000b0009" },
];

// Case-insensitive lookup after trimming; null when the e-mail is not a demo account.
export function findDemoAccountByEmail(email: string): AccountInfo | null {
  const wanted = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === wanted) ?? null;
}

export function findDemoAccountById(id: string): AccountInfo | null {
  return DEMO_ACCOUNTS.find((a) => a.id === id) ?? null;
}

// Parent: their own children. Teacher: the children of the classes they teach. DEMO_CHILDREN order.
export function demoChildrenForAccount(account: { id: string; role: AccountRole }): ChildInfo[] {
  if (account.role === "parent") {
    return DEMO_CHILDREN.filter((c) => c.parent_id === account.id);
  }
  const classIds = new Set(DEMO_CLASSES.filter((k) => k.teacher_id === account.id).map((k) => k.id));
  return DEMO_CHILDREN.filter((c) => classIds.has(c.class_id));
}

// Every demo parent has exactly one child; reports from the extension are filed for that child.
export function demoChildOfParent(parentId: string): ChildInfo | null {
  return DEMO_CHILDREN.find((c) => c.parent_id === parentId) ?? null;
}

export function teacherTeachesChild(teacherId: string, childId: string): boolean {
  const child = DEMO_CHILDREN.find((c) => c.id === childId);
  if (!child) return false;
  return DEMO_CLASSES.some((k) => k.id === child.class_id && k.teacher_id === teacherId);
}
