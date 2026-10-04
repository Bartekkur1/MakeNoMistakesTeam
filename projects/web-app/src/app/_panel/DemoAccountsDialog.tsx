"use client";

// The informational "Konta demo" dialog on /login: the demo accounts a visitor can log in with and
// the shared login code. The data comes from the server page as props (login/page.tsx), so the
// account list never ships inside a JavaScript chunk; it is the same list the landing page shows.
// Choosing an account fills the e-mail field and closes the dialog; nothing is sent.

import { useEffect, useId, useRef } from "react";
import { buttonLarge, buttonSmall } from "@/app/_landing/styles";
import { ACCOUNT_ROLE_LABELS_PL, type AccountRole } from "@/lib/contract/types";
import { DEMO_INFO } from "./content";
import { capitalize } from "./format";
import { badgeBase, secondaryButton } from "./styles";

export interface DemoAccountEntry {
  email: string;
  role: AccountRole;
  name: string;
}

export interface DemoLoginInfo {
  code: string;
  accounts: DemoAccountEntry[];
}

export interface DemoAccountsDialogProps {
  info: DemoLoginInfo;
  onPick: (email: string) => void;
  onClose: () => void;
}

const ROLE_BADGE: Record<AccountRole, string> = {
  parent: "border-shark-blue bg-sky-wash text-shark-blue-dark",
  teacher: "border-titanium-border bg-shield-silver text-navy-slate",
};

export function DemoAccountsDialog({ info, onPick, onClose }: DemoAccountsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-widget bg-white p-6 text-navy-slate shadow-shield-card backdrop:bg-navy-slate/50"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <h2 id={titleId} className="font-display text-xl font-semibold leading-tight">
        {DEMO_INFO.title}
      </h2>
      <p className="mt-2 text-base text-muted-slate">{DEMO_INFO.intro}</p>

      <ul className="mt-4 divide-y divide-shield-silver rounded-dashboard border border-titanium-border">
        {info.accounts.map((account) => (
          <li key={account.email} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{account.name}</span>
                <span className={`${badgeBase} ${ROLE_BADGE[account.role]} px-2 py-0 text-xs`}>
                  {capitalize(ACCOUNT_ROLE_LABELS_PL[account.role])}
                </span>
              </p>
              <p className="mt-1 select-all break-all text-sm text-muted-slate">{account.email}</p>
            </div>
            <button
              type="button"
              className={`${secondaryButton} ${buttonSmall} shrink-0`}
              onClick={() => {
                onPick(account.email);
                dialogRef.current?.close();
              }}
            >
              {DEMO_INFO.use}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-lg bg-sky-wash px-4 py-3 text-base">
        {DEMO_INFO.codeLabel}{" "}
        <code className="select-all rounded bg-white px-2 py-0.5 font-semibold">{info.code}</code>
      </p>

      <div className="mt-6 flex justify-end">
        <button type="button" className={`${secondaryButton} ${buttonLarge}`} onClick={() => dialogRef.current?.close()}>
          {DEMO_INFO.close}
        </button>
      </div>
    </dialog>
  );
}
