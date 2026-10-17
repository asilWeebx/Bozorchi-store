"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import styles from "./Stepper.module.css";

/** "1.44", "10.08", "3": at most three decimals, no trailing zeros. */
const show = (value: number) => String(Math.round(value * 1000) / 1000);

/**
 * − value + with a typable value. The draft is only applied on blur/Enter,
 * so clearing "1" to type "20" does not jump through intermediate values.
 * `decimal` lets the keyboard offer a decimal point (m²).
 */
export function Stepper({
  value,
  onStep,
  onCommit,
  canDecrease = true,
  canIncrease = true,
  suffix,
  label,
  size = "md",
  decimal = false,
}: {
  value: number;
  onStep: (direction: 1 | -1) => void;
  /** Receives the typed text; the parent decides the value. */
  onCommit: (draft: string) => void;
  canDecrease?: boolean;
  canIncrease?: boolean;
  suffix?: string;
  label: string;
  size?: "sm" | "md";
  decimal?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft != null) onCommit(draft);
    setDraft(null);
  };

  return (
    <div className={`${styles.stepper} ${styles[size]}`}>
      <button type="button" className={styles.button} onClick={() => onStep(-1)} disabled={!canDecrease} aria-label="Kamaytirish">
        <Minus size={16} aria-hidden />
      </button>
      <label className={styles.field}>
        <span className="sr-only">{label}</span>
        <input
          className={styles.input}
          inputMode={decimal ? "decimal" : "numeric"}
          value={draft ?? show(value)}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          size={Math.max(2, (draft ?? show(value)).length)}
          // `size` counts average letters; bold tabular digits are wider, so size it in digit widths.
          style={{ width: `${Math.max(2, (draft ?? show(value)).length) + 0.4}ch` }}
        />
        {suffix && (
          <span className={styles.suffix} aria-hidden>
            {suffix}
          </span>
        )}
      </label>
      <button type="button" className={styles.button} onClick={() => onStep(1)} disabled={!canIncrease} aria-label="Ko'paytirish">
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}
