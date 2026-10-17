import type { SpecRow } from "@/lib/shop/specs";

import styles from "./SpecTable.module.css";

/** Label, dotted leader, value. */
export function SpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <dl className={styles.table}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <dt className={styles.label}>{row.label}</dt>
          <dd className={styles.value}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
