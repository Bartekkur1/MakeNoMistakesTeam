// Client-safe display names for the timeline and the list rows (D-02, D-06). The panel ships to
// every visitor, so it never imports @/lib/contract/demo-accounts: that module holds every account
// e-mail and the login code, and the bundler would put all of it into the browser chunk. This map
// keeps only ids and names, already without the "(demo)"/"(smoke)" suffix. tests/panel/format.test.ts
// checks that it matches the demo accounts and children exactly.

// Parent and teacher accounts: account id -> name.
export const PERSON_NAMES: ReadonlyMap<string, string> = new Map([
  ["00000000-0000-4000-8000-0000000a0001", "Mama Oli"],
  ["00000000-0000-4000-8000-0000000a0002", "Tata Kuby"],
  ["00000000-0000-4000-8000-0000000a0003", "Mama Zosi"],
  ["00000000-0000-4000-8000-0000000a0009", "Rodzic testowy"],
  ["00000000-0000-4000-8000-0000000b0001", "Wychowawczyni 5a"],
  ["00000000-0000-4000-8000-0000000b0002", "Wychowawca 6b"],
  ["00000000-0000-4000-8000-0000000b0009", "Nauczyciel testowy"],
]);

// Children: child id -> name.
export const CHILD_NAMES: ReadonlyMap<string, string> = new Map([
  ["00000000-0000-4000-8000-0000000c0001", "Ola"],
  ["00000000-0000-4000-8000-0000000c0002", "Kuba"],
  ["00000000-0000-4000-8000-0000000c0003", "Zosia"],
  ["00000000-0000-4000-8000-0000000c0009", "Dziecko testowe"],
]);
