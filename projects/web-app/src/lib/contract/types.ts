// Contract of the BezpiecznaAura API (reports, workflow, demo login), version 2.
// Single source of truth for the backend (phase 1), the parent/teacher panel (phase 2) and the checker.
// Human-readable spec: .planning/shared/CONTRACT.md
//
// Erasable TypeScript only (no enum, namespace, parameter properties or imports):
// projects/web-app/scripts/check-contract-examples.mjs loads this file through Node type stripping.

// ---------------------------------------------------------------------------
// Report states (D-08, D-15)
// ---------------------------------------------------------------------------

export const REPORT_STATES = ["pending_parent", "rejected", "with_teacher", "escalated", "closed"] as const;
export type ReportState = (typeof REPORT_STATES)[number];

export const REPORT_STATE_LABELS_PL: Record<ReportState, string> = {
  pending_parent: "czeka na rodzica",
  rejected: "odrzucone przez rodzica",
  with_teacher: "u nauczyciela",
  escalated: "eskalowane",
  closed: "zamknięte",
};

export const INITIAL_REPORT_STATE = "pending_parent" as const;

// A teacher sees a report of their own class only in these states (D-15).
export const TEACHER_VISIBLE_STATES = ["with_teacher", "escalated", "closed"] as const;

// ---------------------------------------------------------------------------
// Roles and login scopes (D-14)
// ---------------------------------------------------------------------------

// Roles that have an account and can log in.
export const ACCOUNT_ROLES = ["parent", "teacher"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_ROLE_LABELS_PL: Record<AccountRole, string> = {
  parent: "rodzic",
  teacher: "nauczyciel",
};

// Roles that can appear as the actor of a history entry. The child never logs in;
// it only appears as the actor of the "submit" entry.
export const ACTOR_ROLES = ["child", "parent", "teacher"] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

export const ACTOR_ROLE_LABELS_PL: Record<ActorRole, string> = {
  child: "dziecko",
  parent: "rodzic",
  teacher: "nauczyciel",
};

export const LOGIN_SCOPES = ["panel", "extension"] as const;
export type LoginScope = (typeof LOGIN_SCOPES)[number];

export const LOGIN_SCOPE_LABELS_PL: Record<LoginScope, string> = {
  panel: "panel rodzica lub nauczyciela",
  extension: "wtyczka na urządzeniu dziecka",
};

// ---------------------------------------------------------------------------
// Report content from the child (D-12)
// ---------------------------------------------------------------------------

export const ATTACK_TYPES = [
  "phishing",
  "data_request",
  "fake_prize",
  "purchase_trap",
  "impersonation",
  "other",
] as const;
export type AttackType = (typeof ATTACK_TYPES)[number];

export const ATTACK_TYPE_LABELS_PL: Record<AttackType, string> = {
  phishing: "fałszywy link lub strona logowania",
  data_request: "prośba o dane, hasło lub kod",
  fake_prize: "fałszywa nagroda lub konkurs",
  purchase_trap: "pułapka zakupowa lub prośba o zapłatę",
  impersonation: "ktoś podszywa się pod znajomego, szkołę lub firmę",
  other: "coś innego",
};

// Canonical order: taken_actions on the wire are always sorted in this order.
// An empty list means "nic z tych rzeczy".
export const TAKEN_ACTIONS = [
  "clicked_link",
  "entered_password",
  "shared_code",
  "shared_personal_data",
  "paid",
  "downloaded_file",
  "replied",
] as const;
export type TakenAction = (typeof TAKEN_ACTIONS)[number];

export const TAKEN_ACTION_LABELS_PL: Record<TakenAction, string> = {
  clicked_link: "kliknięcie w link",
  entered_password: "wpisanie loginu lub hasła",
  shared_code: "podanie kodu (np. z SMS-a)",
  shared_personal_data: "podanie danych osobowych (imię, adres, telefon, szkoła)",
  paid: "zapłata lub podanie danych karty",
  downloaded_file: "pobranie pliku lub aplikacji",
  replied: "odpisanie nadawcy",
};

// Checkboxes offered for each attack type, each list in TAKEN_ACTIONS order.
export const ACTIONS_BY_ATTACK_TYPE: Record<AttackType, readonly TakenAction[]> = {
  phishing: ["clicked_link", "entered_password", "downloaded_file", "replied"],
  data_request: ["entered_password", "shared_code", "shared_personal_data", "replied"],
  fake_prize: ["clicked_link", "shared_code", "shared_personal_data", "paid", "replied"],
  purchase_trap: ["clicked_link", "shared_personal_data", "paid"],
  impersonation: ["clicked_link", "shared_code", "shared_personal_data", "paid", "replied"],
  other: TAKEN_ACTIONS,
};

export const REPORT_SOURCES = ["game", "email", "sms", "discord", "other"] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

export const REPORT_SOURCE_LABELS_PL: Record<ReportSource, string> = {
  game: "gra",
  email: "mail",
  sms: "SMS",
  discord: "Discord",
  other: "inne",
};

// ---------------------------------------------------------------------------
// Workflow: transitions and history (D-08, D-09, D-10)
// ---------------------------------------------------------------------------

export const TRANSITION_ACTIONS = ["approve", "reject", "escalate", "close", "reopen"] as const;
export type TransitionAction = (typeof TRANSITION_ACTIONS)[number];

export const TRANSITION_ACTION_LABELS_PL: Record<TransitionAction, string> = {
  approve: "zatwierdź",
  reject: "odrzuć",
  escalate: "eskaluj",
  close: "zamknij",
  reopen: "wznów",
};

// "submit" is the creation entry written by POST /api/reports; the rest are transitions.
export const HISTORY_ACTIONS = ["submit", "approve", "reject", "escalate", "close", "reopen"] as const;
export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

export const HISTORY_ACTION_LABELS_PL: Record<HistoryAction, string> = {
  submit: "zgłoszenie",
  approve: "zatwierdź",
  reject: "odrzuć",
  escalate: "eskaluj",
  close: "zamknij",
  reopen: "wznów",
};

export interface TransitionRule {
  action: TransitionAction;
  from: readonly ReportState[];
  to: ReportState;
  roles: readonly AccountRole[];
}

// The transition matrix. For one action the `from` sets of its rows are disjoint,
// so (action, current state) selects at most one row.
export const TRANSITIONS: readonly TransitionRule[] = [
  { action: "approve", from: ["pending_parent", "rejected"], to: "with_teacher", roles: ["parent"] },
  { action: "reject", from: ["pending_parent", "with_teacher"], to: "rejected", roles: ["parent"] },
  { action: "escalate", from: ["with_teacher"], to: "escalated", roles: ["teacher"] },
  { action: "close", from: ["with_teacher", "escalated"], to: "closed", roles: ["teacher"] },
  { action: "reopen", from: ["closed"], to: "with_teacher", roles: ["parent", "teacher"] },
  { action: "reopen", from: ["rejected"], to: "pending_parent", roles: ["parent"] },
];

// Escalation must name the organisation it went to (D-08).
export const TRANSITION_COMMENT_REQUIRED: Record<TransitionAction, boolean> = {
  approve: false,
  reject: false,
  escalate: true,
  close: false,
  reopen: false,
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export const API_ERROR_CODES = [
  "invalid_json",
  "validation_error",
  "invalid_credentials",
  "unauthorized",
  "forbidden",
  "report_not_found",
  "invalid_transition",
  "payload_too_large",
  "storage_unavailable",
  "internal_error",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const API_ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  invalid_json: 400,
  validation_error: 400,
  invalid_credentials: 401,
  unauthorized: 401,
  forbidden: 403,
  report_not_found: 404,
  invalid_transition: 409,
  payload_too_large: 413,
  storage_unavailable: 503,
  internal_error: 500,
};

export const API_ERROR_MESSAGES_PL: Record<ApiErrorCode, string> = {
  invalid_json: "Treść żądania nie jest poprawnym obiektem JSON.",
  validation_error: "Niepoprawne dane — szczegóły w polu details.",
  invalid_credentials: "Nieprawidłowy e-mail lub kod.",
  unauthorized: "Brak ważnego logowania — zaloguj się ponownie.",
  forbidden: "To konto nie może wykonać tej operacji.",
  report_not_found: "Nie znaleziono zgłoszenia.",
  invalid_transition: "Tej zmiany nie można wykonać w obecnym stanie zgłoszenia.",
  payload_too_large: "Żądanie jest za duże (limit 32 KB).",
  storage_unavailable:
    "Nie udało się zapisać ani odczytać danych — baza jest niedostępna. Nic nie zostało potwierdzone, spróbuj ponownie.",
  internal_error: "Wystąpił nieoczekiwany błąd serwera.",
};

// ---------------------------------------------------------------------------
// Field lists (exact wire keys)
// ---------------------------------------------------------------------------

export const REPORT_FIELDS = [
  "id",
  "child_id",
  "parent_id",
  "attack_type",
  "taken_actions",
  "source",
  "content",
  "state",
  "created_at",
  "updated_at",
] as const;

export const HISTORY_FIELDS = [
  "id",
  "report_id",
  "action",
  "from_state",
  "to_state",
  "actor_id",
  "actor_role",
  "comment",
  "created_at",
] as const;

export const COMMENT_FIELDS = ["id", "report_id", "author_id", "author_role", "body", "created_at"] as const;

export const ACCOUNT_FIELDS = ["id", "email", "role", "display_name"] as const;

export const CHILD_FIELDS = ["id", "display_name", "parent_id", "class_id"] as const;

// ---------------------------------------------------------------------------
// Limits (no fixed list cap: lists are paginated, D-16)
// ---------------------------------------------------------------------------

export const LIMITS = {
  maxBodyBytes: 32768,
  emailMaxChars: 254,
  codeMaxChars: 16,
  contentMaxChars: 5000,
  commentMaxChars: 2000,
  transitionCommentMaxChars: 1000,
  pageDefault: 20,
  pageMax: 100,
  tokenTtlSeconds: 43200,
} as const;

// ---------------------------------------------------------------------------
// Wire objects
// ---------------------------------------------------------------------------

export interface Report {
  id: string;
  child_id: string;
  parent_id: string;
  attack_type: AttackType;
  taken_actions: TakenAction[];
  source: ReportSource;
  content: string;
  state: ReportState;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: string;
  report_id: string;
  action: HistoryAction;
  from_state: ReportState | null;
  to_state: ReportState;
  actor_id: string;
  actor_role: ActorRole;
  comment: string | null;
  created_at: string;
}

// Named ReportComment because Comment is a DOM global.
export interface ReportComment {
  id: string;
  report_id: string;
  author_id: string;
  author_role: AccountRole;
  body: string;
  created_at: string;
}

export interface ReportDetail extends Report {
  history: HistoryEntry[];
  comments: ReportComment[];
}

// Wire body of POST /api/reports.
export interface NewReportRequest {
  attack_type: AttackType;
  taken_actions?: TakenAction[];
  source: ReportSource;
  content: string;
}

// Validated POST /api/reports body: taken_actions deduplicated and in canonical order, content trimmed.
export interface NewReportInput {
  attack_type: AttackType;
  taken_actions: TakenAction[];
  source: ReportSource;
  content: string;
}

export interface TransitionRequest {
  action: TransitionAction;
  comment?: string | null;
}

export interface TransitionResponse {
  report: Report;
  entry: HistoryEntry;
}

export interface NewCommentRequest {
  body: string;
}

export interface ReportListResponse {
  reports: Report[];
  next_cursor: string | null;
}

export interface LoginRequest {
  email: string;
  code: string;
  scope?: LoginScope;
}

export interface AccountInfo {
  id: string;
  email: string;
  role: AccountRole;
  display_name: string;
}

export interface ChildInfo {
  id: string;
  display_name: string;
  parent_id: string;
  class_id: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  scope: LoginScope;
  account: AccountInfo;
  children: ChildInfo[];
}

export interface SessionResponse {
  expires_at: string;
  scope: LoginScope;
  account: AccountInfo;
  children: ChildInfo[];
}

export interface HealthResponse {
  status: "ok";
}

export interface FieldError {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Roblox: the child's nick and the game's training results
// ---------------------------------------------------------------------------

// Roblox usernames: 3 to 20 letters, digits or underscores. Matched case-insensitively.
export const ROBLOX_USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const ROBLOX_USERNAME_MAX_CHARS = 20;

export const ROBLOX_ACCOUNT_FIELDS = ["child_id", "roblox_username", "updated_at"] as const;

// GET /api/roblox-accounts lists one per linked child; POST sets one.
export interface RobloxAccount {
  child_id: string;
  roblox_username: string;
  updated_at: string;
}

export interface RobloxAccountListResponse {
  accounts: RobloxAccount[];
}

export interface SetRobloxAccountRequest {
  child_id: string;
  roblox_username: string;
}

export const ROBLOX_OUTCOMES = ["safe_refusal", "compromised_password"] as const;
export type RobloxOutcome = (typeof ROBLOX_OUTCOMES)[number];

export const ROBLOX_MAX_HINTS = 2;
export const ROBLOX_MAX_SCORE = 3;

// Wire body of POST /api/reports/ingest (sent by the Roblox game server, header x-ingest-secret).
export interface RobloxIngestRequest {
  roblox_username: string;
  roblox_user_id?: number;
  attack_type: AttackType;
  source?: "game";
  taken_actions?: TakenAction[];
  content: string;
  hints_used?: number;
  score?: number;
  outcome?: RobloxOutcome;
}

// The ingest endpoint answers in its own envelope, agreed with the Roblox workstream.
export interface RobloxIngestResponse {
  ok: true;
  report_id: string;
  child_name: string;
  parent_name: string;
  state: ReportState;
  // false when the nick is not linked to any child and the report went to the demo fallback child.
  matched: boolean;
}

export interface RobloxIngestErrorBody {
  ok: false;
  error: string;
  details?: FieldError[];
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: FieldError[];
  };
}
