"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useDialogA11y } from "@/lib/dialog";

import styles from "./FiltersDrawer.module.css";

/**
 * On desktop the filters are a sidebar; on phones they open as a sheet from
 * a "Filtrlar" button, and close again when a filter link is followed.
 */
export function FiltersDrawer({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [openAt, setOpenAt] = useState<string | null>(null);
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const url = `${pathname}?${search}`;
  // Following a filter link changes the URL, which closes the sheet.
  const open = openAt === url;
  const close = () => setOpenAt(null);
  const sheetRef = useDialogA11y<HTMLDivElement>(open, close);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpenAt(url)}>
        <SlidersHorizontal size={16} aria-hidden />
        Filtrlar
        {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
      </button>

      <div className={styles.sidebar}>{children}</div>

      {open && (
        <div className={styles.backdrop} onClick={close}>
          <div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Filtrlar"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Filtrlar</h2>
              <button type="button" className={styles.close} onClick={close} aria-label="Yopish">
                <X size={20} aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
