"use client";

// Deleting one's own comment from the timeline (D-11, amended 2026-10-04). Two steps, without a
// browser dialog: "Usuń" shows an inline question, "Tak, usuń" sends the DELETE. Only the server's
// 204 removes the comment from the timeline. Deleting is idempotent, so after any failure the
// question stays open and the user can simply try again.

import { useRef, useState } from "react";
import { buttonSmall } from "@/app/_landing/styles";
import { deleteComment, errorMessage, isUnauthorized } from "./api";
import { COMMENT_DELETE } from "./content";
import { expireSession } from "./session";
import { alertError, secondaryButton } from "./styles";

export interface DeleteCommentButtonProps {
  reportId: string;
  commentId: string;
  token: string;
  onDeleted: (commentId: string) => void;
  onNotFound: () => void;
}

const dangerButton =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-colors border border-hook-crimson bg-hook-crimson text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue disabled:cursor-not-allowed disabled:opacity-60";
const quietButton =
  "rounded text-sm font-semibold text-muted-slate underline-offset-2 hover:text-hook-crimson hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue";

export function DeleteCommentButton({ reportId, commentId, token, onDeleted, onNotFound }: DeleteCommentButtonProps) {
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  function cancel() {
    setAsking(false);
    setAlert(null);
    // The "Usuń" button is back after this render; focus returns to it.
    requestAnimationFrame(() => deleteRef.current?.focus());
  }

  function confirm() {
    if (pending) return;
    setPending(true);
    setAlert(null);
    deleteComment(token, reportId, commentId).then((result) => {
      setPending(false);
      if (result.ok) {
        onDeleted(commentId);
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
      if (result.kind === "http" && result.code === "forbidden") {
        setAlert(COMMENT_DELETE.forbidden);
        return;
      }
      setAlert(errorMessage(result, COMMENT_DELETE.networkError));
    });
  }

  // While asking, focus sits on "Tak, usuń", so a keyboard user answers the question right away.
  if (!asking) {
    return (
      <button
        ref={deleteRef}
        type="button"
        className={quietButton}
        aria-label={COMMENT_DELETE.deleteLabel}
        onClick={() => setAsking(true)}
      >
        {COMMENT_DELETE.delete}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-titanium-border bg-ice-surface p-3">
      <p className="text-sm">{COMMENT_DELETE.confirm}</p>
      {alert !== null ? (
        <div role="alert" className={`${alertError} mt-2 text-sm`}>
          <p>{alert}</p>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`${dangerButton} ${buttonSmall}`}
          onClick={confirm}
          disabled={pending}
          aria-busy={pending}
          autoFocus
        >
          {pending ? COMMENT_DELETE.pending : COMMENT_DELETE.confirmYes}
        </button>
        <button type="button" className={`${secondaryButton} ${buttonSmall}`} onClick={cancel} disabled={pending}>
          {COMMENT_DELETE.cancel}
        </button>
      </div>
    </div>
  );
}
