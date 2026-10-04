"use client";

// The new-comment form under the timeline (D-03, D-13). The draft is controlled by the detail page,
// so a refresh never touches it and plan 02-05 can move an unsent transition note into it. A blank
// comment is blocked here without a request. While sending, the button reads "Wysyłanie…" and the
// field is read-only. Only the server's 201 adds the comment to the timeline. Comments are not
// idempotent, so each submit sends exactly once, nothing is resent automatically, and every error
// keeps the typed text; after a network failure the user is told to check the timeline first.

import { useId, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { buttonLarge } from "@/app/_landing/styles";
import { LIMITS, type ReportComment } from "@/lib/contract/types";
import { errorMessage, isUnauthorized, postComment } from "./api";
import { COMMENT } from "./content";
import { draftAfterSent, fillTemplate } from "./format";
import { expireSession } from "./session";
import { alertError, fieldError as fieldErrorClasses, panelPrimaryButton, textareaBase } from "./styles";

export interface CommentFormProps {
  reportId: string;
  token: string;
  draft: string;
  // A state setter: a confirmed comment updates the field from its current value, which may have
  // gained a moved transition note while the comment was sending.
  onDraftChange: Dispatch<SetStateAction<string>>;
  onAdded: (comment: ReportComment) => void;
  onNotFound: () => void;
  // Called once when a request starts (the page clears its last announcement).
  onSubmitStart?: () => void;
}

export function CommentForm({ reportId, token, draft, onDraftChange, onAdded, onNotFound, onSubmitStart }: CommentFormProps) {
  const [pending, setPending] = useState(false);
  const [fieldMessage, setFieldMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const baseId = useId();
  const fieldId = `${baseId}-field`;
  const helperId = `${baseId}-helper`;
  const counterId = `${baseId}-counter`;
  const errorId = `${baseId}-error`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const body = draft.trim();
    if (body === "") {
      setAlert(null);
      setFieldMessage(COMMENT.empty);
      textareaRef.current?.focus();
      return;
    }

    // The field as submitted: on success only this text is cleared (WR-04).
    const sent = draft;
    setPending(true);
    setFieldMessage(null);
    setAlert(null);
    onSubmitStart?.();
    postComment(token, reportId, body).then((result) => {
      setPending(false);
      if (result.ok) {
        onDraftChange((current) => draftAfterSent(current, sent));
        onAdded(result.value);
        return;
      }
      if (isUnauthorized(result)) {
        // The shell sees the cleared session and sends the visitor to /login with the banner.
        expireSession(token);
        return;
      }
      if (result.kind === "http" && result.code === "report_not_found") {
        onNotFound();
        return;
      }
      if (result.kind === "http" && result.code === "validation_error") {
        const detail = result.details.find((entry) => entry.field === "body") ?? result.details[0];
        if (detail) {
          setFieldMessage(detail.message);
          textareaRef.current?.focus();
          return;
        }
      }
      setAlert(errorMessage(result, COMMENT.networkError));
    });
  }

  const describedBy = [helperId, counterId, fieldMessage !== null ? errorId : null].filter(Boolean).join(" ");

  return (
    <form className="mt-8 border-t border-shield-silver pt-6" onSubmit={submit} noValidate>
      <label htmlFor={fieldId} className="block text-sm font-semibold">
        {COMMENT.label}
      </label>
      <p id={helperId} className="mt-1 text-sm text-muted-slate">
        {COMMENT.helper}
      </p>
      <textarea
        ref={textareaRef}
        id={fieldId}
        className={`${textareaBase} mt-2`}
        value={draft}
        onChange={(event) => {
          onDraftChange(event.target.value);
          if (fieldMessage !== null) setFieldMessage(null);
        }}
        maxLength={LIMITS.commentMaxChars}
        readOnly={pending}
        aria-describedby={describedBy}
        aria-invalid={fieldMessage !== null ? true : undefined}
      />
      <p id={counterId} className="mt-1 text-right text-sm text-muted-slate">
        {fillTemplate(COMMENT.counter, { n: String(draft.length), max: String(LIMITS.commentMaxChars) })}
      </p>
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
      <button
        type="submit"
        className={`${panelPrimaryButton} ${buttonLarge} mt-4 w-full sm:w-auto`}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? COMMENT.pending : COMMENT.submit}
      </button>
    </form>
  );
}
