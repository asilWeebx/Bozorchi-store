import type { ComponentProps } from "react";

import styles from "./Container.module.css";

/** Centers page content at the site width, with side gutters. */
export function Container({ className, ...rest }: ComponentProps<"div">) {
  return <div className={[styles.container, className].filter(Boolean).join(" ")} {...rest} />;
}
