import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "dark" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

interface Common {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

function classes({ variant = "primary", size = "md", block, className }: Common) {
  return [styles.button, styles[variant], styles[size], block && styles.block, className].filter(Boolean).join(" ");
}

export function Button({ variant, size, block, icon, children, className, type = "button", ...rest }: Common & ComponentProps<"button">) {
  return (
    <button type={type} className={classes({ variant, size, block, className })} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, block, icon, children, className, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={classes({ variant, size, block, className })} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
