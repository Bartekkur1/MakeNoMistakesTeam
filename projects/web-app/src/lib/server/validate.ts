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
  ROBLOX_MAX_SCORE,
  ROBLOX_OUTCOMES,
  ROBLOX_MAX_HINTS,
  ROBLOX_USERNAME_PATTERN,
  TAKEN_ACTIONS,
  TRANSITION_ACTIONS,
  TRANSITION_COMMENT_REQUIRED,
  type AttackType,
  type FieldError,
  type LoginScope,
  type NewReportInput,
  type ReportSource,
  type ReportState,
  type RobloxOutcome,
  type TakenAction,
  type TransitionAction,
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

// Postgres text cannot hold U+0000, and PostgREST rejects unpaired UTF-16 surrogates as invalid
// JSON Unicode. Both are valid in a JSON string, so without this check they reach the database
// and come back as a false 503 storage_unavailable. Rejecting them here gives a 400 instead.
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;

function hasUnstorableChars(value: string): boolean {
  return value.includes("\u0000") || LONE_SURROGATE.test(value);
}

const UNSTORABLE_CHARS_MESSAGE = "Tekst zawiera niedozwolone znaki.";

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
  } else if (hasUnstorableChars(content)) {
    errors.push({ field: "content", message: UNSTORABLE_CHARS_MESSAGE });
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

// ---------------------------------------------------------------------------
// POST /api/reports/{id}/transitions (contract "Obieg zgłoszenia", D-08)
// ---------------------------------------------------------------------------

export interface TransitionInput {
  action: TransitionAction;
  comment: string | null;
}

function isTransitionAction(value: unknown): value is TransitionAction {
  return typeof value === "string" && (TRANSITION_ACTIONS as readonly string[]).includes(value);
}

// Only action and comment are read; every other key (actor_id, actor_role, states...) is dropped,
// so the history actor always comes from the session. A blank comment counts as no comment.
export function parseTransition(body: Record<string, unknown>): ValidationResult<TransitionInput> {
  const errors: FieldError[] = [];

  const action = isTransitionAction(body.action) ? body.action : null;
  if (action === null) {
    errors.push({ field: "action", message: "Nieznana akcja." });
  }

  let comment: string | null = null;
  let commentError = false;
  const rawComment = body.comment;
  if (rawComment !== undefined && rawComment !== null) {
    if (typeof rawComment !== "string") {
      errors.push({ field: "comment", message: "Komentarz musi być tekstem." });
      commentError = true;
    } else {
      const trimmed = rawComment.trim();
      if (charLength(trimmed) > LIMITS.transitionCommentMaxChars) {
        errors.push({ field: "comment", message: "Komentarz jest za długi (maks. 1000 znaków)." });
        commentError = true;
      } else if (hasUnstorableChars(trimmed)) {
        errors.push({ field: "comment", message: UNSTORABLE_CHARS_MESSAGE });
        commentError = true;
      } else if (trimmed !== "") {
        comment = trimmed;
      }
    }
  }

  if (action !== null && !commentError && comment === null && TRANSITION_COMMENT_REQUIRED[action]) {
    errors.push({ field: "comment", message: "Przy eskalacji wpisz, do kogo zgłoszono incydent." });
  }

  if (errors.length > 0 || action === null) return { ok: false, errors };
  return { ok: true, value: { action, comment } };
}

// ---------------------------------------------------------------------------
// POST /api/reports/{id}/comments (contract "Komentarze", D-11)
// ---------------------------------------------------------------------------

export interface CommentInput {
  body: string;
}

// Only body is read; author fields and every other key are dropped (the author is the session).
export function parseComment(body: Record<string, unknown>): ValidationResult<CommentInput> {
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text === "") {
    return { ok: false, errors: [{ field: "body", message: "Komentarz nie może być pusty." }] };
  }
  if (charLength(text) > LIMITS.commentMaxChars) {
    return { ok: false, errors: [{ field: "body", message: "Komentarz jest za długi (maks. 2000 znaków)." }] };
  }
  if (hasUnstorableChars(text)) {
    return { ok: false, errors: [{ field: "body", message: UNSTORABLE_CHARS_MESSAGE }] };
  }
  return { ok: true, value: { body: text } };
}

// ---------------------------------------------------------------------------
// POST /api/roblox-accounts (contract "Konto Roblox dziecka")
// ---------------------------------------------------------------------------

export interface RobloxAccountInput {
  childId: string;
  robloxUsername: string;
}

const ROBLOX_USERNAME_MESSAGE = "Nick Roblox ma od 3 do 20 znaków: litery, cyfry lub podkreślnik.";

// Only child_id and roblox_username are read. The nick keeps the spelling the parent typed.
export function parseRobloxAccount(body: Record<string, unknown>): ValidationResult<RobloxAccountInput> {
  const errors: FieldError[] = [];

  const childId = isUuid(body.child_id) ? body.child_id.toLowerCase() : null;
  if (childId === null) {
    errors.push({ field: "child_id", message: "Wybierz dziecko." });
  }

  const username = typeof body.roblox_username === "string" ? body.roblox_username.trim() : "";
  if (username === "") {
    errors.push({ field: "roblox_username", message: "Wpisz nick Roblox." });
  } else if (!ROBLOX_USERNAME_PATTERN.test(username)) {
    errors.push({ field: "roblox_username", message: ROBLOX_USERNAME_MESSAGE });
  }

  if (errors.length > 0 || childId === null) return { ok: false, errors };
  return { ok: true, value: { childId, robloxUsername: username } };
}

// ---------------------------------------------------------------------------
// POST /api/reports/ingest (Roblox game server)
// ---------------------------------------------------------------------------

// The stored content is a header line plus the game's summary; this leaves room for the header
// within LIMITS.contentMaxChars.
export const ROBLOX_INGEST_CONTENT_MAX_CHARS = 4500;

export interface RobloxIngestInput {
  attemptId: string;
  robloxUsername: string;
  robloxUserId: number | null;
  attackType: AttackType;
  takenActions: TakenAction[];
  content: string;
  hintsUsed: number | null;
  score: number | null;
  outcome: RobloxOutcome | null;
  trainingId: string;
  trainingName: string;
}

function isRobloxOutcome(value: unknown): value is RobloxOutcome {
  return typeof value === "string" && (ROBLOX_OUTCOMES as readonly string[]).includes(value);
}

function optionalIntInRange(
  body: Record<string, unknown>,
  field: string,
  max: number,
  errors: FieldError[],
): number | null {
  const value = body[field];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) {
    errors.push({ field, message: `Pole ${field} musi być liczbą całkowitą od 0 do ${max}.` });
    return null;
  }
  return value;
}

// Exercise outcomes describe fictional choices, never inferred real credential entry.
// Explicit actions remain supported for other callers; the phase-3 exercise sends [].
export function parseRobloxIngest(body: Record<string, unknown>): ValidationResult<RobloxIngestInput> {
  const errors: FieldError[] = [];

  const attemptId = isUuid(body.attempt_id) ? body.attempt_id.toLowerCase() : null;
  if (attemptId === null) errors.push({ field: "attempt_id", message: "Podaj identyfikator próby UUID." });

  const username = typeof body.roblox_username === "string" ? body.roblox_username.trim() : "";
  if (!ROBLOX_USERNAME_PATTERN.test(username)) {
    errors.push({ field: "roblox_username", message: ROBLOX_USERNAME_MESSAGE });
  }

  const userId = body.roblox_user_id;
  if (userId !== undefined && userId !== null && (typeof userId !== "number" || !Number.isSafeInteger(userId) || userId <= 0)) {
    errors.push({ field: "roblox_user_id", message: "Pole roblox_user_id musi być dodatnią liczbą całkowitą." });
  }

  const attackType = isAttackType(body.attack_type) ? body.attack_type : null;
  if (attackType === null) {
    errors.push({ field: "attack_type", message: "Nieznany rodzaj ataku." });
  }

  if (body.source !== undefined && body.source !== "game") {
    errors.push({ field: "source", message: "Źródło zgłoszenia z Roblox to zawsze game." });
  }

  const takenActions: TakenAction[] = [];
  const rawActions = body.taken_actions === undefined || body.taken_actions === null ? [] : body.taken_actions;
  if (!Array.isArray(rawActions)) {
    errors.push({ field: "taken_actions", message: "Pole taken_actions musi być listą." });
  } else {
    rawActions.forEach((action: unknown, index: number) => {
      if (!isTakenAction(action)) {
        errors.push({ field: `taken_actions[${index}]`, message: "Nieznane działanie." });
      } else if (!takenActions.includes(action)) {
        takenActions.push(action);
      }
    });
  }

  let outcome: RobloxOutcome | null = null;
  if (body.outcome !== undefined && body.outcome !== null) {
    if (isRobloxOutcome(body.outcome)) {
      outcome = body.outcome;
    } else {
      errors.push({ field: "outcome", message: "Nieznany wynik szkolenia." });
    }
  }
  const hintsUsed = optionalIntInRange(body, "hints_used", ROBLOX_MAX_HINTS, errors);
  const score = optionalIntInRange(body, "score", ROBLOX_MAX_SCORE, errors);

  const rawTrainingId = typeof body.training_id === "string" ? body.training_id.trim() : "";
  const trainingId = rawTrainingId !== "" ? rawTrainingId : "password_phishing";
  if (trainingId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(trainingId)) {
    errors.push({ field: "training_id", message: "Identyfikator szkolenia może zawierać tylko litery, cyfry, myślniki i podkreślenia (maks. 64 znaki)." });
  }

  const rawTrainingName = typeof body.training_name === "string" ? body.training_name.trim() : "";
  const trainingName = rawTrainingName !== "" ? rawTrainingName : "Przeciwdziałanie wyłudzaniu hasła";
  if (trainingName.length > 128) {
    errors.push({ field: "training_name", message: "Nazwa szkolenia może mieć maksymalnie 128 znaków." });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content === "") {
    errors.push({ field: "content", message: "Treść nie może być pusta." });
  } else if (charLength(content) > ROBLOX_INGEST_CONTENT_MAX_CHARS) {
    errors.push({ field: "content", message: `Treść jest za długa (maks. ${ROBLOX_INGEST_CONTENT_MAX_CHARS} znaków).` });
  } else if (hasUnstorableChars(content)) {
    errors.push({ field: "content", message: UNSTORABLE_CHARS_MESSAGE });
  }

  if (errors.length > 0 || attackType === null || attemptId === null) return { ok: false, errors };
  return {
    ok: true,
    value: {
      attemptId,
      robloxUsername: username,
      robloxUserId: typeof userId === "number" ? userId : null,
      attackType,
      takenActions: takenActions.sort(canonicalActionOrder),
      content,
      hintsUsed,
      score,
      outcome,
      trainingId,
      trainingName,
    },
  };
}
