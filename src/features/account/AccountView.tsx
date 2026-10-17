"use client";

import { BackButton } from "@/components/layout/NavActions";
import { useCustomer } from "@/lib/customer/useCustomer";

import styles from "./AccountView.module.css";
import { CustomerPortal } from "./CustomerPortal";
import { HapticPreference } from "./HapticPreference";
import { LoginForm } from "./LoginForm";

/** Sign-in with the in-store customer code, or the signed-in customer's account. */
export function AccountView() {
  const { customer, ready, signIn, signOut } = useCustomer();
  if (!ready) return <div className={styles.skeleton} aria-busy="true" />;
  return (
    <>
      <BackButton fallback="/" />
      {customer ? <CustomerPortal customer={customer} onLogout={signOut} /> : <LoginForm onLogin={signIn} />}
      <HapticPreference />
    </>
  );
}
