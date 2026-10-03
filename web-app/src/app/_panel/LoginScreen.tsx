"use client";

// Two-step login (D-05, D-06): step 1 only collects the e-mail and sends nothing, so an unknown
// address is not revealed; step 2 sends e-mail and code in one call. A wrong e-mail and a wrong
// code get the same message under the code field. Nothing on this screen hints at the code or
// lists accounts (D-02). The e-mail stays in component state, never in the URL.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonLarge, textLink } from "@/app/_landing/styles";
import { API_ERROR_MESSAGES_PL, LIMITS } from "@/lib/contract/types";
import { errorMessage, loginRequest } from "./api";
import { LOGIN, PANEL_HREF, SHELL } from "./content";
import { SessionLoading } from "./PanelShell";
import { clearNotice, readNotice, saveSession, useSession, type SessionNotice } from "./session";
import { alertError, alertWarning, card, fieldError, inputBase, panelPrimaryButton } from "./styles";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const EMAIL_ERROR_ID = "login-email-error";
const CODE_ERROR_ID = "login-code-error";

type Step = "email" | "code";

export function LoginScreen() {
  const state = useSession();
  const router = useRouter();
  const authenticated = state.status === "authenticated";

  useEffect(() => {
    if (authenticated) {
      router.replace(PANEL_HREF);
    }
  }, [authenticated, router]);

  if (state.status === "anonymous") {
    return <LoginCard />;
  }
  return <SessionLoading />;
}

// The banner left by the end of the previous session (D-07). The session-expired text is the
// contract message, shown verbatim (UI-SPEC A9).
function SessionNoticeBanner({ notice }: { notice: SessionNotice }) {
  return (
    <div role="status" className={`${alertWarning} mt-6`}>
      {notice === "expired" ? API_ERROR_MESSAGES_PL.unauthorized : SHELL.loggedOut}
    </div>
  );
}

// Renders only on the client, after the session snapshot resolved to anonymous, so the lazy
// readNotice initializer never runs on the server.
function LoginCard() {
  const [notice] = useState(readNotice);
  useEffect(() => {
    clearNotice();
  }, []);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  function submitEmail(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = email.trim();
    if (trimmed === "") {
      setEmailError(LOGIN.emailEmpty);
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError(LOGIN.emailInvalid);
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);
    setFormError(null);
    setCode("");
    setCodeError(null);
    setStep("code");
  }

  async function submitCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    if (code.trim() === "") {
      setCodeError(LOGIN.codeEmpty);
      codeRef.current?.focus();
      return;
    }
    setCodeError(null);
    setPending(true);

    const result = await loginRequest(email, code);
    if (result.ok) {
      // The session snapshot flips to authenticated and LoginScreen redirects to /panel.
      saveSession(result.value);
      return;
    }

    setPending(false);
    if (result.kind === "http" && result.code === "invalid_credentials") {
      setCode("");
      setCodeError(API_ERROR_MESSAGES_PL.invalid_credentials);
      codeRef.current?.focus();
      return;
    }
    if (result.kind === "http" && result.code === "validation_error") {
      // The server's field texts are developer copy; the form shows its own (D-02).
      if (result.details.some((detail) => detail.field === "email")) {
        setEmailError(LOGIN.emailInvalid);
        setStep("email");
        return;
      }
      setCodeError(LOGIN.codeEmpty);
      codeRef.current?.focus();
      return;
    }
    setFormError(errorMessage(result));
  }

  function changeEmail(): void {
    setPending(false);
    setCode("");
    setCodeError(null);
    setFormError(null);
    setStep("email");
  }

  const [introBefore, introAfter] = LOGIN.step2Intro.split("{email}");

  return (
    <main className="flex-1 bg-ice-surface pb-12">
      <div className="mx-auto max-w-md px-4 pt-8 md:pt-16">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 rounded-lg font-display text-base font-semibold text-navy-slate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue"
        >
          <Image src="/scamerino-head-128.png" alt="" width={40} height={40} className="h-10 w-10" />
          {SHELL.brand}
        </Link>

        <div className={`${card} p-6 md:p-8`}>
          {step === "email" ? (
            <>
              <h1 className="font-display text-2xl font-semibold leading-tight">{LOGIN.step1Title}</h1>
              <p className="mt-2 text-base text-muted-slate">{LOGIN.step1Intro}</p>
              {notice ? <SessionNoticeBanner notice={notice} /> : null}
              <form noValidate onSubmit={submitEmail} className="mt-6">
                <label htmlFor="login-email" className="block text-sm font-semibold text-navy-slate">
                  {LOGIN.emailLabel}
                </label>
                <input
                  ref={emailRef}
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={LIMITS.emailMaxChars}
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? EMAIL_ERROR_ID : undefined}
                  className={`${inputBase} mt-2`}
                />
                {emailError ? (
                  <p id={EMAIL_ERROR_ID} className={fieldError}>
                    {emailError}
                  </p>
                ) : null}
                <button type="submit" className={`${panelPrimaryButton} ${buttonLarge} mt-6 w-full`}>
                  {LOGIN.next}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold leading-tight">{LOGIN.step2Title}</h1>
              <p className="mt-2 text-base text-muted-slate">
                {introBefore}
                <span className="font-semibold text-navy-slate [overflow-wrap:anywhere]">{email.trim()}</span>
                {introAfter}
              </p>
              {formError ? (
                <div role="alert" className={`${alertError} mt-6`}>
                  {formError}
                </div>
              ) : null}
              <form noValidate onSubmit={submitCode} className="mt-6">
                <label htmlFor="login-code" className="block text-sm font-semibold text-navy-slate">
                  {LOGIN.codeLabel}
                </label>
                <input
                  ref={codeRef}
                  id="login-code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={LIMITS.codeMaxChars}
                  autoFocus
                  readOnly={pending}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? CODE_ERROR_ID : undefined}
                  className={`${inputBase} mt-2`}
                />
                {codeError ? (
                  <p id={CODE_ERROR_ID} className={fieldError}>
                    {codeError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending ? true : undefined}
                  className={`${panelPrimaryButton} ${buttonLarge} mt-6 w-full`}
                >
                  {pending ? LOGIN.pending : LOGIN.submit}
                </button>
              </form>
              <p className="mt-4 text-center">
                <button type="button" onClick={changeEmail} disabled={pending} className={`${textLink} text-sm`}>
                  {LOGIN.changeEmail}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className={textLink}>
            {LOGIN.backHome}
          </Link>
        </p>
      </div>
    </main>
  );
}
