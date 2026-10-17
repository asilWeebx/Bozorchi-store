"use client";

import { User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Customer } from "@/lib/storefront/types";

import styles from "./LoginForm.module.css";

/** Sign-in with the customer code printed in the store (CUST-XXXXXX). */
export function LoginForm({ onLogin }: { onLogin: (customer: Customer) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("ID raqamingizni kiriting");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Xatolik yuz berdi");
      onLogin(data as Customer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.card} onSubmit={submit} noValidate>
      <span className={styles.icon}>
        <User size={28} aria-hidden />
      </span>
      <h1 className={styles.title}>Mijoz sifatida kirish</h1>
      <p className={styles.text}>
        Do‘kondan olgan ID raqamingizni kiriting. Kirgach, shaxsiy narxlaringiz, xaridlaringiz va qarzingizni
        ko‘rasiz.
      </p>
      <label className={styles.field}>
        <span className="sr-only">Mijoz ID raqami</span>
        <input
          className={styles.input}
          name="code"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="CUST-XXXXXX"
        />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? "Tekshirilmoqda..." : "Kirish"}
      </Button>
    </form>
  );
}
