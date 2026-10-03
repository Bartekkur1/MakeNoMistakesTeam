// RED skeleton: not implemented yet.
import type { FieldError, LoginScope } from "@/lib/contract/types";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

export function isUuid(value: unknown): boolean {
  void value;
  return false;
}

export function parseLogin(body: Record<string, unknown>): ValidationResult<{ email: string; code: string; scope: LoginScope }> {
  void body;
  return { ok: false, errors: [] };
}
