// Hand-written request validation (no schema library). Every parser collects all field
// errors at once and returns either the normalized value or the FieldError list for the
// validation_error envelope. Unknown keys are dropped.

import { LIMITS, LOGIN_SCOPES, type FieldError, type LoginScope } from "@/lib/contract/types";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isLoginScope(value: unknown): value is LoginScope {
  return typeof value === "string" && (LOGIN_SCOPES as readonly string[]).includes(value);
}

export interface LoginInput {
  email: string;
  code: string;
  scope: LoginScope;
}

export function parseLogin(body: Record<string, unknown>): ValidationResult<LoginInput> {
  const errors: FieldError[] = [];

  let email = "";
  if (typeof body.email === "string") {
    email = body.email.trim().toLowerCase();
  }
  if (email.length < 3 || email.length > LIMITS.emailMaxChars || !email.includes("@")) {
    errors.push({ field: "email", message: "Podaj adres e-mail." });
  }

  let code = "";
  if (typeof body.code === "string") {
    code = body.code.trim();
  }
  if (code.length < 1 || code.length > LIMITS.codeMaxChars) {
    errors.push({ field: "code", message: "Podaj kod z wiadomości (w demo: 0000)." });
  }

  let scope: LoginScope = "panel";
  if (body.scope !== undefined) {
    if (isLoginScope(body.scope)) {
      scope = body.scope;
    } else {
      errors.push({ field: "scope", message: "Nieznany zakres logowania." });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { email, code, scope } };
}
