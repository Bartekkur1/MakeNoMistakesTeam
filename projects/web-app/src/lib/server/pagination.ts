// Cursor pagination for GET /api/reports (D-16, contract "Paginacja").
// A cursor is base64url(JSON.stringify({ c: created_at, i: id })) of the last report on a page,
// with the keys in exactly that order (contract v2, reproduced in get-reports.json). Lists are
// ordered created_at desc, id desc; the next page starts right after the cursor row.

export interface CursorPosition {
  createdAt: string;
  id: string;
}

const CURSOR_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
// Same pattern as isUuid in validate.ts; kept local because validate.ts imports this module.
const CURSOR_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(row: { created_at: string; id: string }): string {
  return Buffer.from(JSON.stringify({ c: row.created_at, i: row.id }), "utf8").toString("base64url");
}

// Null for anything that is not a cursor this server issued: bad base64url or JSON, other keys,
// a timestamp that is not YYYY-MM-DDTHH:mm:ss.sssZ or not a real instant, or a non-UUID id.
export function decodeCursor(value: string): CursorPosition | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const { c, i } = record;
  if (typeof c !== "string" || !CURSOR_TIMESTAMP.test(c)) return null;
  const time = new Date(c);
  if (Number.isNaN(time.getTime()) || time.toISOString() !== c) return null;
  if (typeof i !== "string" || !CURSOR_UUID.test(i)) return null;
  // Canonical encoding only (same keys, same order, same bytes), as the contract checker demands.
  if (encodeCursor({ created_at: c, id: i }) !== value) return null;
  return { createdAt: c, id: i };
}

// `rows` holds up to limit + 1 rows; the extra one only signals that another page exists.
export function paginate<T extends { created_at: string; id: string }>(
  rows: T[],
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit && page.length > 0 ? encodeCursor(page[page.length - 1]) : null;
  return { page, nextCursor };
}
