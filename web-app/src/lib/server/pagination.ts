// RED skeleton: not implemented yet.
export interface CursorPosition {
  createdAt: string;
  id: string;
}

export function encodeCursor(row: { created_at: string; id: string }): string {
  void row;
  return "";
}

export function decodeCursor(value: string): CursorPosition | null {
  void value;
  return null;
}

export function paginate<T extends { created_at: string; id: string }>(
  rows: T[],
  limit: number,
): { page: T[]; nextCursor: string | null } {
  void limit;
  return { page: rows, nextCursor: null };
}
