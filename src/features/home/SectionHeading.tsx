import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./SectionHeading.module.css";

/** "[icon] Sirdaryo kafel  27 ta ········· Barchasi →" */
export function SectionHeading({
  title,
  note,
  href,
  count,
  linkLabel = "Barchasi",
  icon,
  tone = "light",
}: {
  title: string;
  note?: string;
  href?: string;
  count?: number;
  linkLabel?: string;
  icon?: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div className={`${styles.heading} ${tone === "dark" ? styles.dark : ""}`}>
      <div className={styles.titles}>
        <h2 className={styles.title}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {title}
          {count != null && <span className={styles.count}>{count} ta</span>}
        </h2>
        {note && <p className={styles.note}>{note}</p>}
      </div>
      {href && (
        <Link href={href} className={styles.link}>
          {linkLabel}
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  );
}
