"use client";

import { ArrowLeft, LayoutGrid, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCustomer } from "@/lib/customer/useCustomer";

import styles from "./NavActions.module.css";
import { useShopUi } from "./ShopUi";

export function CatalogButton({ className }: { className?: string }) {
  const { open, overlay } = useShopUi();
  return (
    <button type="button" className={className} onClick={() => open("catalog")} aria-haspopup="dialog" aria-expanded={overlay === "catalog"}>
      <LayoutGrid size={18} aria-hidden />
      Katalog
    </button>
  );
}

export function AccountLink({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  const { customer, ready } = useCustomer();
  const pathname = usePathname();
  const name = ready && customer ? customer.name || customer.customer_name || customer.customer_code : "";
  return (
    <Link
      href="/account"
      className={className}
      aria-current={pathname.startsWith("/account") ? "page" : undefined}
      aria-label={name ? `${name}: shaxsiy kabinet` : "Mijoz sifatida kirish"}
    >
      {name ? <span className={styles.avatar}>{name.charAt(0).toUpperCase()}</span> : <User size={22} strokeWidth={1.75} aria-hidden />}
      <span className={labelClassName}>{name ? "Hisobim" : "Kirish"}</span>
    </Link>
  );
}

export function BackButton({ fallback = "/catalog" }: { fallback?: string }) {
  const { back } = useShopUi();
  return (
    <button type="button" className={styles.back} onClick={() => back(fallback)}>
      <ArrowLeft size={16} aria-hidden />
      Orqaga
    </button>
  );
}
