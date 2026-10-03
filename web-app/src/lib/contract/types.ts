// Contract of the BezpiecznaAura API (cases and replies), version 1.
// Single source of truth for the backend (phase 1) and the guardian panel (phase 2).
// Human-readable spec: .planning/shared/CONTRACT.md
//
// Erasable TypeScript only (no enum, namespace, parameter properties or imports):
// web-app/scripts/check-contract-examples.mjs loads this file through Node type stripping.

export const CASE_STATUSES = ["new", "in_progress", "closed"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS_PL: Record<CaseStatus, string> = {
  new: "nowa",
  in_progress: "w rozmowie",
  closed: "zakończona",
};

export const CASE_SOURCES = ["game", "email", "sms", "discord", "other"] as const;
export type CaseSource = (typeof CASE_SOURCES)[number];

export const CASE_SOURCE_LABELS_PL: Record<CaseSource, string> = {
  game: "gra",
  email: "mail",
  sms: "SMS",
  discord: "Discord",
  other: "inne",
};

// Answer to "Czy już kliknąłeś, podałeś dane lub zapłaciłeś?" as one value.
// The child picks the most serious one that applies.
export const ALREADY_ACTED_VALUES = ["no", "clicked", "shared_data", "paid", "unsure"] as const;
export type AlreadyActed = (typeof ALREADY_ACTED_VALUES)[number];

export const ALREADY_ACTED_LABELS_PL: Record<AlreadyActed, string> = {
  no: "nic z tych rzeczy",
  clicked: "kliknięcie linku",
  shared_data: "podanie danych",
  paid: "zapłata",
  unsure: "nie wiem",
};

export const API_ERROR_CODES = [
  "invalid_json",
  "validation_error",
  "payload_too_large",
  "case_not_found",
  "storage_unavailable",
  "internal_error",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const API_ERROR_MESSAGES_PL: Record<ApiErrorCode, string> = {
  invalid_json: "Treść żądania nie jest poprawnym obiektem JSON.",
  validation_error: "Niepoprawne dane — szczegóły w polu details.",
  payload_too_large: "Żądanie jest za duże (limit 32 KB).",
  case_not_found: "Nie znaleziono sprawy.",
  storage_unavailable:
    "Nie udało się zapisać ani odczytać danych — baza jest niedostępna. Nic nie zostało potwierdzone, spróbuj ponownie.",
  internal_error: "Wystąpił nieoczekiwany błąd serwera.",
};

export const CASE_FIELDS = [
  "id",
  "demo_child_id",
  "source",
  "content",
  "signals",
  "selected_action",
  "already_acted",
  "status",
  "created_at",
  "updated_at",
] as const;

export const REPLY_FIELDS = ["id", "case_id", "message", "created_at"] as const;

export const LIMITS = {
  maxBodyBytes: 32768,
  demoChildIdMaxChars: 64,
  contentMaxChars: 5000,
  signalsMaxItems: 20,
  signalMaxChars: 200,
  selectedActionMaxChars: 200,
  messageMaxChars: 2000,
  listMaxItems: 200,
} as const;

export const DEMO_CHILD_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export interface Case {
  id: string;
  demo_child_id: string;
  source: CaseSource;
  content: string;
  signals: string[];
  selected_action: string | null;
  already_acted: AlreadyActed;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  case_id: string;
  message: string;
  created_at: string;
}

export interface CaseWithReplies extends Case {
  replies: Reply[];
}

// Wire body of POST /api/cases.
export interface NewCaseRequest {
  demo_child_id: string;
  source: CaseSource;
  content: string;
  signals?: string[];
  selected_action?: string | null;
  already_acted?: AlreadyActed;
}

// Validated POST body with defaults applied (signals [], selected_action null, already_acted "unsure").
export interface NewCaseInput {
  demo_child_id: string;
  source: CaseSource;
  content: string;
  signals: string[];
  selected_action: string | null;
  already_acted: AlreadyActed;
}

export interface CaseStatusUpdateRequest {
  status: CaseStatus;
}

export interface NewReplyRequest {
  message: string;
}

export interface CaseListResponse {
  cases: Case[];
}

export interface HealthResponse {
  status: "ok";
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: FieldError[];
  };
}
