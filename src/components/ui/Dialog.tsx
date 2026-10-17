"use client";

import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useDialogA11y } from "@/lib/dialog";

import styles from "./Dialog.module.css";

export function Dialog({ title, onClose, children, footer, side = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; side?: boolean }) {
  const ref = useDialogA11y(true, onClose);
  const id = useId();
  return createPortal(
    <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={ref} className={`${styles.dialog} ${side ? styles.side : ""}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <header className={styles.head}>
          <h2 id={id}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={`${title}: yopish`}><X size={22} aria-hidden /></button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </div>, document.body,
  );
}
