// Panel class strings (02-UI-SPEC.md). Every value is a complete literal class list, because
// Tailwind 4 only generates classes whose whole name appears in the source.

import { primaryButton } from "@/app/_landing/styles";
import type { ReportState } from "@/lib/contract/types";

// Buttons. Same base as the landing buttons so the focus rings match; pair with buttonSmall or buttonLarge.
export const secondaryButton =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-colors border border-titanium-border bg-white text-navy-slate hover:bg-ice-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue disabled:cursor-not-allowed disabled:opacity-60";
export const panelPrimaryButton = `${primaryButton} disabled:cursor-not-allowed disabled:opacity-60`;

// Form controls.
export const inputBase =
  "block w-full h-12 rounded-lg border border-titanium-border bg-white px-4 text-base text-navy-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue aria-[invalid=true]:border-hook-crimson";
export const textareaBase =
  "block w-full min-h-32 rounded-lg border border-titanium-border bg-white px-4 py-2 text-base leading-6 text-navy-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue aria-[invalid=true]:border-hook-crimson";
export const selectBase =
  "h-10 rounded-lg border border-titanium-border bg-white px-3 text-sm text-navy-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue";

// Surfaces.
export const card = "rounded-dashboard border border-titanium-border bg-white shadow-shield-card";

// State badges (D-09). The contract label is always shown, so color is never the only cue.
export const badgeBase = "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold leading-5";
export const STATE_BADGE_CLASSES: Record<ReportState, string> = {
  pending_parent: "border-siren-amber bg-siren-amber/15 text-navy-slate",
  rejected: "border-titanium-border bg-white text-muted-slate",
  with_teacher: "border-shark-blue bg-sky-wash text-shark-blue-dark",
  escalated: "border-shark-blue-dark bg-shark-blue-dark text-white",
  closed: "border-titanium-border bg-shield-silver text-navy-slate",
};

// Risk marker (D-04, D-10).
export const riskBadgeClasses = "border-hook-crimson bg-hook-crimson/10 text-navy-slate";

// Alerts and field errors.
export const alertError = "rounded-lg border-l-4 border-hook-crimson bg-hook-crimson/10 p-4 text-navy-slate";
export const alertWarning = "rounded-lg border-l-4 border-siren-amber bg-siren-amber/10 p-4 text-navy-slate";
export const alertSuccess = "rounded-lg border-l-4 border-shark-blue bg-sky-wash p-4 text-navy-slate";
export const fieldError = "mt-2 border-l-4 border-hook-crimson bg-hook-crimson/10 px-2 py-1 text-sm text-navy-slate";

// Loading placeholders (no animation with reduced motion).
export const skeletonBlock = "motion-safe:animate-pulse rounded-lg bg-shield-silver";
