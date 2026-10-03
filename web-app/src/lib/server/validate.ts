// Hand-written request validation (no schema library). Every parser collects all field
// errors at once and returns either the normalized value or the FieldError list for the
// validation_error envelope. Unknown keys are dropped.

import {
  ACTIONS_BY_ATTACK_TYPE,
  ATTACK_TYPES,
  LIMITS,
  LOGIN_SCOPES,
  REPORT_SOURCES,
  REPORT_STATES,
  TAKEN_ACTIONS,
  type AttackType,
  type FieldError,
  type LoginScope,
  type NewReportInput,
  type ReportSource,
  type ReportState,
  type TakenAction,
} from "@/lib/contract/types";
import { decodeCursor, type CursorPosition } from "./pagination";

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

// ---------------------------------------------------------------------------
// POST /api/reports (contract "Zgłoszenie", D-12)
// ---------------------------------------------------------------------------

function isAttackType(value: unknown): value is AttackType {
  return typeof value === "string" && (ATTACK_TYPES as readonly string[]).includes(value);
}

function isTakenAction(value: unknown): value is TakenAction {
  return typeof value === "string" && (TAKEN_ACTIONS as readonly string[]).includes(value);
}

function isReportSource(value: unknown): value is ReportSource {
  return typeof value === "string" && (REPORT_SOURCES as readonly string[]).includes(value);
}

// Length in characters (code points), like Postgres char_length.
function charLength(value: string): number {
  return [...value].length;
}

function canonicalActionOrder(a: TakenAction, b: TakenAction): number {
  return TAKEN_ACTIONS.indexOf(a) - TAKEN_ACTIONS.indexOf(b);
}

// taken_actions may be omitted (contract: optional, default []); when present it must be a list.
// Only attack_type, taken_actions, source and content are read; every other key is dropped.
export function parseNewReport(body: Record<string, unknown>): ValidationResult<NewReportInput> {
  const errors: FieldError[] = [];

  const attackType = isAttackType(body.attack_type) ? body.attack_type : null;
  if (attackType === null) {
    errors.push({ field: "attack_type", message: "Wybierz rodzaj ataku." });
  }

  const takenActions: TakenAction[] = [];
  const rawActions = body.taken_actions === undefined ? [] : body.taken_actions;
  if (!Array.isArray(rawActions)) {
    errors.push({ field: "taken_actions", message: "Zaznacz podjęte działania (pusta lista = nic z tych rzeczy)." });
  } else {
    const allowed = attackType === null ? null : ACTIONS_BY_ATTACK_TYPE[attackType];
    let duplicate = false;
    rawActions.forEach((action: unknown, index: number) => {
      const field = `taken_actions[${index}]`;
      if (!isTakenAction(action)) {
        errors.push({ field, message: "Nieznane działanie." });
        return;
      }
      if (takenActions.includes(action)) {
        duplicate = true;
        return;
      }
      if (allowed !== null && !allowed.includes(action)) {
        errors.push({ field, message: "To działanie nie pasuje do wybranego rodzaju ataku." });
        return;
      }
      takenActions.push(action);
    });
    if (duplicate) {
      errors.push({ field: "taken_actions", message: "Działania nie mogą się powtarzać." });
    }
  }

  const source = isReportSource(body.source) ? body.source : null;
  if (source === null) {
    errors.push({ field: "source", message: "Wybierz źródło wiadomości." });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content === "") {
    errors.push({ field: "content", message: "Treść nie może być pusta." });
  } else if (charLength(content) > LIMITS.contentMaxChars) {
    errors.push({ field: "content", message: "Treść jest za długa (maks. 5000 znaków)." });
  }

  if (errors.length > 0 || attackType === null || source === null) return { ok: false, errors };
  return {
    ok: true,
    value: {
      attack_type: attackType,
      taken_actions: [...takenActions].sort(canonicalActionOrder),
      source,
      content,
    },
  };
}

// ---------------------------------------------------------------------------
// GET /api/reports query (contract "Paginacja", D-16)
// ---------------------------------------------------------------------------

export interface ListQuery {
  limit: number;
  cursor: CursorPosition | null;
  state: ReportState | null;
}

function isReportState(value: unknown): value is ReportState {
  return typeof value === "string" && (REPORT_STATES as readonly string[]).includes(value);
}

// limit 1..100 (default 20), cursor taken verbatim from next_cursor, optional state filter.
// Other parameters are ignored.
export function parseListQuery(params: URLSearchParams): ValidationResult<ListQuery> {
  const errors: FieldError[] = [];

  let limit: number = LIMITS.pageDefault;
  const rawLimit = params.get("limit");
  if (rawLimit !== null) {
    const parsed = /^\d+$/.test(rawLimit) ? Number(rawLimit) : NaN;
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= LIMITS.pageMax) {
      limit = parsed;
    } else {
      errors.push({ field: "limit", message: "Parametr limit musi być liczbą od 1 do 100." });
    }
  }

  let cursor: CursorPosition | null = null;
  const rawCursor = params.get("cursor");
  if (rawCursor !== null) {
    cursor = decodeCursor(rawCursor);
    if (cursor === null) {
      errors.push({ field: "cursor", message: "Nieprawidłowy kursor — użyj wartości next_cursor." });
    }
  }

  let state: ReportState | null = null;
  const rawState = params.get("state");
  if (rawState !== null) {
    if (isReportState(rawState)) {
      state = rawState;
    } else {
      errors.push({ field: "state", message: "Nieznany stan zgłoszenia." });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { limit, cursor, state } };
}
