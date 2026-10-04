"use client";

// The "Konto Roblox dziecka" card on the parent's list page. The parent links the nick their child
// uses in Roblox; the game then sends training results with that nick to POST /api/reports/ingest
// and they land in this panel as new reports. One row per child: a linked nick shows as text with
// "Zmień nick", an unlinked child (or "Zmień nick") shows the form. A nick shows as saved only
// after the server's 200. A 401 ends the session like everywhere else in the panel.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { buttonLarge, buttonSmall } from "@/app/_landing/styles";
import { ROBLOX_USERNAME_MAX_CHARS, ROBLOX_USERNAME_PATTERN, type ChildInfo, type RobloxAccount } from "@/lib/contract/types";
import { errorMessage, fetchRobloxAccounts, isUnauthorized, saveRobloxAccount, type ApiFailure } from "./api";
import { ERRORS, ROBLOX } from "./content";
import { displayName, fillTemplate } from "./format";
import { expireSession, type PanelSession } from "./session";
import {
  alertError,
  alertSuccess,
  badgeBase,
  card,
  fieldError as fieldErrorClasses,
  inputBase,
  panelPrimaryButton,
  secondaryButton,
  skeletonBlock,
} from "./styles";

type LoadState =
  | { status: "loading" }
  | { status: "error"; failure: ApiFailure }
  | { status: "ready"; accounts: RobloxAccount[] };

export function RobloxAccountCard({ session }: { session: PanelSession }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const token = session.token;

  useEffect(() => {
    let ignore = false;
    fetchRobloxAccounts(token).then((result) => {
      if (ignore) return;
      if (isUnauthorized(result)) {
        expireSession(token);
        return;
      }
      setState(result.ok ? { status: "ready", accounts: result.value.accounts } : { status: "error", failure: result });
    });
    return () => {
      ignore = true;
    };
  }, [token, attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  function onSaved(saved: RobloxAccount) {
    setState((current) =>
      current.status === "ready"
        ? {
            status: "ready",
            accounts: [...current.accounts.filter((a) => a.child_id !== saved.child_id), saved],
          }
        : current,
    );
  }

  return (
    <section aria-labelledby="roblox-card-title" className={`${card} mt-6 p-4 md:p-6`}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-wash font-display text-lg font-semibold text-shark-blue-dark"
        >
          R
        </span>
        <div className="min-w-0">
          <h2 id="roblox-card-title" className="font-display text-xl font-semibold leading-tight">
            {ROBLOX.title}
          </h2>
          <p className="mt-1 text-base text-muted-slate">{ROBLOX.intro}</p>
        </div>
      </div>

      {state.status === "loading" ? (
        <div className="mt-4">
          <p className="sr-only">{ROBLOX.loading}</p>
          <div aria-hidden="true" className={`${skeletonBlock} h-5 w-40`} />
          <div aria-hidden="true" className={`${skeletonBlock} mt-2 h-12 w-full`} />
        </div>
      ) : null}

      {state.status === "error" ? (
        <div role="alert" className={`${alertError} mt-4 flex flex-wrap items-center justify-between gap-4`}>
          <p>{errorMessage(state.failure)}</p>
          <button type="button" className={`${secondaryButton} ${buttonSmall}`} onClick={retry}>
            {ERRORS.retry}
          </button>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <ul className="mt-4 divide-y divide-shield-silver border-t border-shield-silver">
          {session.children.map((child) => (
            <RobloxChildRow
              key={child.id}
              child={child}
              token={token}
              account={state.accounts.find((a) => a.child_id === child.id) ?? null}
              onSaved={onSaved}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface RobloxChildRowProps {
  child: ChildInfo;
  token: string;
  account: RobloxAccount | null;
  onSaved: (account: RobloxAccount) => void;
}

function RobloxChildRow({ child, token, account, onSaved }: RobloxChildRowProps) {
  const [editing, setEditing] = useState(account === null);
  const [draft, setDraft] = useState(account?.roblox_username ?? "");
  const [pending, setPending] = useState(false);
  const [fieldMessage, setFieldMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [savedNick, setSavedNick] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const fieldId = `${baseId}-field`;
  const helperId = `${baseId}-helper`;
  const errorId = `${baseId}-error`;
  const childName = displayName(child.display_name);

  function startEditing() {
    setDraft(account?.roblox_username ?? "");
    setSavedNick(null);
    setEditing(true);
    // The input mounts on the next render.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cancel() {
    setEditing(false);
    setFieldMessage(null);
    setAlert(null);
    requestAnimationFrame(() => changeRef.current?.focus());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nick = draft.trim();
    if (nick === "" || !ROBLOX_USERNAME_PATTERN.test(nick)) {
      setAlert(null);
      setFieldMessage(nick === "" ? ROBLOX.empty : ROBLOX.invalid);
      inputRef.current?.focus();
      return;
    }

    setPending(true);
    setFieldMessage(null);
    setAlert(null);
    saveRobloxAccount(token, child.id, nick).then((result) => {
      setPending(false);
      if (result.ok) {
        onSaved(result.value);
        setSavedNick(result.value.roblox_username);
        setEditing(false);
        return;
      }
      if (isUnauthorized(result)) {
        expireSession(token);
        return;
      }
      if (result.kind === "http" && result.code === "validation_error") {
        const detail = result.details.find((entry) => entry.field === "roblox_username");
        if (detail) {
          setFieldMessage(detail.message);
          inputRef.current?.focus();
          return;
        }
      }
      setAlert(errorMessage(result, ROBLOX.networkError));
    });
  }

  if (!editing && account !== null) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-slate">{childName}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span className="truncate font-display text-lg font-semibold text-navy-slate">{account.roblox_username}</span>
            <span className={`${badgeBase} border-shark-blue bg-sky-wash text-shark-blue-dark`}>{ROBLOX.linked}</span>
          </p>
          {savedNick !== null ? (
            <div role="status" className={`${alertSuccess} mt-4`}>
              <p>{fillTemplate(ROBLOX.saved, { nick: savedNick })}</p>
            </div>
          ) : null}
        </div>
        <button ref={changeRef} type="button" className={`${secondaryButton} ${buttonSmall}`} onClick={startEditing}>
          {ROBLOX.change}
        </button>
      </li>
    );
  }

  const describedBy = [helperId, fieldMessage !== null ? errorId : null].filter(Boolean).join(" ");

  return (
    <li className="py-4">
      <form onSubmit={submit} noValidate>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={fieldId} className="block text-sm font-semibold">
            {fillTemplate(ROBLOX.label, { child: childName })}
          </label>
          {account === null ? (
            <span className={`${badgeBase} border-titanium-border bg-white text-muted-slate`}>{ROBLOX.notLinked}</span>
          ) : null}
        </div>
        <p id={helperId} className="mt-1 text-sm text-muted-slate">
          {ROBLOX.helper}
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            id={fieldId}
            type="text"
            className={`${inputBase} sm:flex-1`}
            value={draft}
            placeholder={ROBLOX.placeholder}
            onChange={(event) => {
              setDraft(event.target.value);
              if (fieldMessage !== null) setFieldMessage(null);
            }}
            maxLength={ROBLOX_USERNAME_MAX_CHARS}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            readOnly={pending}
            aria-describedby={describedBy}
            aria-invalid={fieldMessage !== null ? true : undefined}
          />
          <button
            type="submit"
            className={`${panelPrimaryButton} ${buttonLarge} shrink-0`}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? ROBLOX.pending : ROBLOX.save}
          </button>
          {account !== null ? (
            <button
              type="button"
              className={`${secondaryButton} ${buttonLarge} shrink-0`}
              onClick={cancel}
              disabled={pending}
            >
              {ROBLOX.cancel}
            </button>
          ) : null}
        </div>
        {fieldMessage !== null ? (
          <p id={errorId} className={fieldErrorClasses}>
            {fieldMessage}
          </p>
        ) : null}
        {alert !== null ? (
          <div role="alert" className={`${alertError} mt-4`}>
            <p>{alert}</p>
          </div>
        ) : null}
      </form>
    </li>
  );
}
