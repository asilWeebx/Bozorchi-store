import Link from "next/link";
import { Fragment } from "react";

import styles from "./Breadcrumbs.module.css";

/** "Bosh sahifa / Katalog / Qurilish mollari"; the last crumb is the current page. */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className={styles.crumbs} aria-label="Yo'l">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && <span aria-hidden>/</span>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
