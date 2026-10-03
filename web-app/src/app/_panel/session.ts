// The panel session (D-07, UI-SPEC A7): one shared entry in localStorage that survives closing
// the tab, never a cookie and never part of a URL. The reason for the next /login banner
// travels through sessionStorage. This is the only panel module that touches browser storage;
// blocked or broken storage counts as no session.

import { useMemo, useSyncExternalStore } from "react";
import { ACCOUNT_ROLES, type AccountInfo, type ChildInfo, type LoginResponse } from "@/lib/contract/types";

export const SESSION_STORAGE_KEY = "bezpiecznaaura.panel.session";
export const NOTICE_STORAGE_KEY = "bezpiecznaaura.panel.notice";
// Fired in this tab after a save or clear; other tabs hear the "storage" event instead.
const SESSION_EVENT = "bezpiecznaaura:session";

export interface PanelSession {
  token: string;
  expires_at: string;
  account: AccountInfo;
  children: ChildInfo[];
}

export type SessionNotice = "expired" | "logged_out";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: PanelSession };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAccount(value: unknown): value is AccountInfo {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.display_name === "string" &&
    (ACCOUNT_ROLES as readonly unknown[]).includes(value.role)
  );
}

// A stored session, or null for anything that is not one (missing, not JSON, wrong shape).
export function decodeSession(raw: string | null): PanelSession | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const { token, expires_at, account, children } = value;
  if (typeof token !== "string" || token === "" || typeof expires_at !== "string") return null;
  if (!isAccount(account) || !Array.isArray(children)) return null;
  return { token, expires_at, account, children: children as ChildInfo[] };
}

// Expired once expires_at is reached; an unreadable date counts as expired.
export function isSessionExpired(session: PanelSession, nowMs: number): boolean {
  const expiresMs = Date.parse(session.expires_at);
  return Number.isNaN(expiresMs) || expiresMs <= nowMs;
}

export function sessionFromLogin(response: LoginResponse): PanelSession {
  return {
    token: response.token,
    expires_at: response.expires_at,
    account: response.account,
    children: response.children,
  };
}

function emitChange(): void {
  try {
    window.dispatchEvent(new Event(SESSION_EVENT));
  } catch {
    // No window: nothing is listening.
  }
}

function readStoredSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSession(response: LoginResponse): void {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionFromLogin(response)));
  } catch {
    // Blocked storage: the session snapshot stays anonymous.
  }
  emitChange();
}

// Removes the session; a non-null notice is shown once on the next /login screen.
export function clearSession(notice: SessionNotice | null): void {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Blocked storage holds no session.
  }
  if (notice !== null) {
    try {
      window.sessionStorage.setItem(NOTICE_STORAGE_KEY, notice);
    } catch {
      // The banner is a courtesy; losing it is harmless.
    }
  }
  emitChange();
}

export function hasStoredSession(): boolean {
  return readStoredSession() !== null;
}

// Non-destructive read of the pending notice.
export function readNotice(): SessionNotice | null {
  try {
    const value = window.sessionStorage.getItem(NOTICE_STORAGE_KEY);
    return value === "expired" || value === "logged_out" ? value : null;
  } catch {
    return null;
  }
}

export function clearNotice(): void {
  try {
    window.sessionStorage.removeItem(NOTICE_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

// Client snapshot: the raw stored string while it holds a live session, else "". Returning the
// raw string keeps the snapshot stable between calls. The clock is read here, outside render code.
function getSnapshot(): string {
  const raw = readStoredSession();
  const session = decodeSession(raw);
  if (raw === null || session === null || isSessionExpired(session, Date.now())) return "";
  return raw;
}

// The server cannot see browser storage: it always renders the loading state.
function getServerSnapshot(): string | null {
  return null;
}

export function useSession(): SessionState {
  const raw = useSyncExternalStore<string | null>(subscribe, getSnapshot, getServerSnapshot);
  return useMemo<SessionState>(() => {
    if (raw === null) return { status: "loading" };
    const session = decodeSession(raw);
    return session ? { status: "authenticated", session } : { status: "anonymous" };
  }, [raw]);
}
