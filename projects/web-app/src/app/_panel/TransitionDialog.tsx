"use client";

// The confirmation dialog for one state change (D-12): a native modal <dialog> with the action's
// consequence, a note field and two buttons. "Zostaw bez zmian" and Esc close it without sending
// anything, so the report keeps its state. Escalation needs a note naming the recipient; a blank
// one is blocked here without a request. While the request runs both buttons are disabled and Esc
// is ignored, so the dialog cannot close while the result is unknown; if the browser closes it
// anyway (a repeated Esc or the Android back gesture may not be cancelable), it reopens at once so
// the result still has a place to show. Only the server's 201 closes it with the new state
// (CONTRACT "Potwierdzenie zapisu"). A 409 (D-15) closes it and hands the unsent note to the page,
// with any earlier attempt whose result stayed unknown; a 404 shows the not-found view; every other
// failure keeps the dialog open with the typed note and an error, and nothing is resent
// automatically.

import { useEffect, useId, useRef, useState } from "react";
import { buttonLarge } from "@/app/_landing/styles";
import { LIMITS, type ReportState, type TransitionAction, type TransitionResponse } from "@/lib/contract/types";
import { postTransition } from "./api";
import { DIALOG } from "./content";
import {
  actionButtonLabel,
  dialogCopy,
  fillTemplate,
  isUnconfirmedFailure,
  missingRequiredNote,
  transitionComment,
  transitionOutcome,
  type UnconfirmedAttempt,
} from "./format";
import { expireSession } from "./session";
import { alertError, fieldError as fieldErrorClasses, panelPrimaryButton, secondaryButton, textareaBase } from "./styles";

export interface TransitionDialogProps {
  reportId: string;
  token: string;
  action: TransitionAction;
  fromState: ReportState;
  onDone: (response: TransitionResponse) => void;
  // The unsent note, and the earlier attempts of this dialog whose result stayed unknown (null when
  // there were none): the page then checks whether the 409 answers one of them (WR-02).
  onConflict: (note: string, attempt: UnconfirmedAttempt | null) => void;
  onNotFound: () => void;
  // Called when the dialog closed for any reason (the card then removes it).
  onClose: () => void;
}

export function TransitionDialog({
  reportId,
  token,
  action,
  fromState,
  onDone,
  onConflict,
  onNotFound,
  onClose,
}: TransitionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [fieldMessage, setFieldMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  // The note of every attempt whose result stayed unknown (a dropped connection, a timeout or a
  // server error): the server may have saved it although no 201 arrived.
  const unconfirmedComments = useRef<(string | null)[]>([]);
  // Mirrors `pending` for the close handler, which must see a request that started in this render.
  const pendingRef = useRef(false);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const fieldId = `${baseId}-field`;
  const counterId = `${baseId}-counter`;
  const errorId = `${baseId}-error`;
  const copy = dialogCopy(action, fromState);

  // Opens as a modal once mounted; the browser makes the page behind it inert and returns focus to
  // the button that opened it when it closes.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    textareaRef.current?.focus();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  function confirm() {
    if (pending) return;
    if (missingRequiredNote(action, note)) {
      setAlert(null);
      setFieldMessage(DIALOG.escalateEmpty);
      textareaRef.current?.focus();
      return;
    }

    const comment = transitionComment(note);
    pendingRef.current = true;
    setPending(true);
    setFieldMessage(null);
    setAlert(null);
    postTransition(token, reportId, action, comment).then((result) => {
      pendingRef.current = false;
      setPending(false);
      const outcome = transitionOutcome(result, DIALOG.networkError);
      switch (outcome.kind) {
        case "done":
          closeDialog();
          onDone(outcome.response);
          return;
        case "conflict": {
          const sent = unconfirmedComments.current;
          closeDialog();
          onConflict(comment ?? "", sent.length === 0 ? null : { action, fromState, comments: sent });
          return;
        }
        case "not-found":
          closeDialog();
          onNotFound();
          return;
        case "expired":
          // The shell sees the cleared session and sends the visitor to /login with the banner.
          expireSession(token);
          return;
        case "field":
          setFieldMessage(outcome.message);
          textareaRef.current?.focus();
          return;
        case "alert":
          if (isUnconfirmedFailure(result)) {
            unconfirmedComments.current = [...unconfirmedComments.current, comment];
          }
          setAlert(outcome.message);
          return;
      }
    });
  }

  const describedBy = [counterId, fieldMessage !== null ? errorId : null].filter(Boolean).join(" ");

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-widget bg-white p-6 text-navy-slate shadow-shield-card backdrop:bg-navy-slate/50"
      onClose={() => {
        // A close the cancel guard could not stop: closing now would unmount the dialog and lose
        // the result of the running request, so it reopens and waits for the answer (WR-06).
        const dialog = dialogRef.current;
        if (pendingRef.current && dialog && dialog.isConnected && !dialog.open) {
          dialog.showModal();
          return;
        }
        onClose();
      }}
      onCancel={(event) => {
        // Esc while the result is unknown would hide whether the change was saved.
        if (pendingRef.current) event.preventDefault();
      }}
    >
      <h2 id={titleId} className="font-display text-xl font-semibold leading-tight">
        {copy.title}
      </h2>
      <p className="mt-2 text-base">{copy.body}</p>

      <div className="mt-6">
        <label htmlFor={fieldId} className="block text-sm font-semibold">
          {copy.noteLabel}
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          className={`${textareaBase} mt-2`}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            if (fieldMessage !== null) setFieldMessage(null);
          }}
          maxLength={LIMITS.transitionCommentMaxChars}
          readOnly={pending}
          aria-describedby={describedBy}
          aria-invalid={fieldMessage !== null ? true : undefined}
        />
        <p id={counterId} className="mt-1 text-right text-sm text-muted-slate">
          {fillTemplate(DIALOG.counter, { n: String(note.length), max: String(LIMITS.transitionCommentMaxChars) })}
        </p>
        {fieldMessage !== null ? (
          <p id={errorId} className={fieldErrorClasses}>
            {fieldMessage}
          </p>
        ) : null}
      </div>

      {alert !== null ? (
        <div role="alert" className={`${alertError} mt-4`}>
          <p>{alert}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
        <button type="button" className={`${secondaryButton} ${buttonLarge}`} onClick={closeDialog} disabled={pending}>
          {DIALOG.dismiss}
        </button>
        <button
          type="button"
          className={`${panelPrimaryButton} ${buttonLarge}`}
          onClick={confirm}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? DIALOG.pending : actionButtonLabel(action)}
        </button>
      </div>
    </dialog>
  );
}
