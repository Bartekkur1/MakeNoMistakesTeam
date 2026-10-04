"use client";

// A one-time-code field split into single-digit boxes. The value lives in the parent as one string;
// each box shows one digit of it. Typing moves forward, Backspace on an empty box moves back, and a
// pasted or autofilled code (several digits landing in one box) is spread across the boxes.

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type OtpInputProps = {
  id: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  // Called once the last box is filled, with the full code.
  onComplete?: (value: string) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  describedBy?: string;
  // Id of the visible label that names the whole group.
  labelledBy?: string;
  // Accessible name of each box, e.g. "Cyfra 1 z 4".
  digitLabel: (index: number, length: number) => string;
};

export type OtpInputHandle = { focus: () => void };

const boxClass =
  "h-14 w-12 rounded-lg border border-titanium-border bg-white text-center font-display text-2xl font-semibold text-navy-slate caret-shark-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shark-blue aria-[invalid=true]:border-hook-crimson md:h-16 md:w-14";

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { id, length, value, onChange, onComplete, readOnly, autoFocus, invalid, describedBy, labelledBy, digitLabel },
  ref,
) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  // The value as of the last edit. Focus moves to the next box inside the same event that changed
  // the value, before React re-renders, so onFocus must not read the stale `value` prop.
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);

  function focusBox(index: number): void {
    const box = boxes.current[Math.max(0, Math.min(length - 1, index))];
    box?.focus();
    box?.select();
  }

  // Focus goes to the first empty box (or the last one when the code is complete).
  useImperativeHandle(ref, () => ({ focus: () => focusBox(Math.min(value.length, length - 1)) }));

  function update(next: string): void {
    const clean = next.replace(/\D/g, "").slice(0, length);
    latest.current = clean;
    onChange(clean);
    if (clean.length === length && clean !== value) onComplete?.(clean);
  }

  // Writes digits starting at `index`, so typing over a middle box or pasting there both work.
  function writeAt(index: number, digits: string): void {
    const start = Math.min(index, value.length);
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, length);
    update(next);
    focusBox(start + digits.length);
  }

  function handleChange(index: number, raw: string): void {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return;
    // A box holding its old digit plus a newly typed one (caret before or after it): keep the new one.
    const old = value[index];
    const typed = old !== undefined && digits.length === 2 ? (digits.startsWith(old) ? digits[1] : digits[0]) : digits;
    writeAt(index, typed);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (readOnly) return;
      if (value[index] !== undefined) {
        update(value.slice(0, index) + value.slice(index + 1));
        focusBox(index);
      } else if (index > 0) {
        update(value.slice(0, index - 1) + value.slice(index));
        focusBox(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(Math.min(index + 1, value.length));
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault();
    if (readOnly) return;
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (digits !== "") writeAt(index, digits);
  }

  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="flex justify-center gap-3">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            boxes.current[index] = element;
          }}
          id={index === 0 ? id : undefined}
          name={index === 0 ? "code" : undefined}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          // The first box accepts a whole autofilled code; the rest take one digit each.
          maxLength={index === 0 ? length : 2}
          autoFocus={autoFocus && index === 0}
          readOnly={readOnly}
          value={value[index] ?? ""}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => {
            // Boxes fill left to right: clicking past the first empty box lands on it instead.
            if (index > latest.current.length) focusBox(latest.current.length);
            else event.target.select();
          }}
          aria-label={digitLabel(index, length)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className={boxClass}
        />
      ))}
    </div>
  );
});
