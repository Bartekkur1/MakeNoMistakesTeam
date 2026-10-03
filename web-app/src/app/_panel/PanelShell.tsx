"use client";

// The guarded panel shell (D-08): until the session snapshot is known only the loading text
// renders, an anonymous visitor is sent to /login, and a logged-in account gets the header with
// its name, role and logout. Every API caller inside the shell handles a 401 with
// clearSession("expired"), which flips the snapshot to anonymous and lands here.
// No role switcher and no change-account control (D-01), no footer and nothing marking a
// presentation build (D-02).

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { LOGIN_HREF } from "@/app/_landing/content";
import { buttonSmall } from "@/app/_landing/styles";
import { ACCOUNT_ROLE_LABELS_PL, type AccountInfo } from "@/lib/contract/types";
import { PANEL_HREF, SHELL } from "./content";
import { capitalize, displayName } from "./format";
import { clearSession, hasStoredSession, useSession, type PanelSession } from "./session";
import { secondaryButton } from "./styles";

const SessionContext = createContext<PanelSession | null>(null);

// The authenticated session of the surrounding PanelShell.
export function useCurrentSession(): PanelSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useCurrentSession must be used inside an authenticated PanelShell");
  }
  return session;
}

// Shown while the session guard decides; no panel content before that.
export function SessionLoading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-ice-surface px-4">
      <p role="status" className="text-base text-muted-slate">
        {SHELL.loading}
      </p>
    </main>
  );
}

export interface PanelHeaderProps {
  account: AccountInfo;
  onLogout: () => void;
}

export function PanelHeader({ account, onLogout }: PanelHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-titanium-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href={PANEL_HREF}
          className="flex shrink-0 items-center gap-2 rounded-lg font-display text-base font-semibold text-navy-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue"
        >
          <Image src="/scamerino-head-128.png" alt="" width={40} height={40} className="h-10 w-10" />
          <span className="sr-only sm:not-sr-only">{SHELL.brand}</span>
        </Link>
        <div className="flex min-w-0 items-center gap-4">
          <p className="flex min-w-0 flex-col text-sm sm:flex-row sm:items-center sm:gap-1">
            <span className="truncate max-w-40 sm:max-w-64 font-semibold text-navy-slate">
              {displayName(account.display_name)}
            </span>
            <span aria-hidden="true" className="hidden text-muted-slate sm:inline">
              ·
            </span>
            <span className="text-muted-slate">{capitalize(ACCOUNT_ROLE_LABELS_PL[account.role])}</span>
          </p>
          <button
            type="button"
            onClick={onLogout}
            className={`${secondaryButton} ${buttonSmall} shrink-0 whitespace-nowrap`}
          >
            {SHELL.logout}
          </button>
        </div>
      </div>
    </header>
  );
}

// Logout needs no API call: the client simply forgets the token (CONTRACT "Logowanie demo").
function logout(): void {
  clearSession("logged_out");
}

export function PanelShell({ children }: { children: ReactNode }) {
  const state = useSession();
  const router = useRouter();
  const anonymous = state.status === "anonymous";

  useEffect(() => {
    if (!anonymous) return;
    // A stored session that is expired or unreadable ends with the session-expired banner (D-07).
    // Logout and a 401 already removed the entry with their own notice, so they add none here.
    if (hasStoredSession()) {
      clearSession("expired");
    }
    router.replace(LOGIN_HREF);
  }, [anonymous, router]);

  if (state.status !== "authenticated") {
    return <SessionLoading />;
  }

  return (
    <SessionContext.Provider value={state.session}>
      <PanelHeader account={state.session.account} onLogout={logout} />
      <div className="flex flex-1 flex-col bg-ice-surface">{children}</div>
    </SessionContext.Provider>
  );
}
