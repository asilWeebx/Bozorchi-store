"use client";

import { CreditCard, FileText, LogOut, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { hasCurrencyBalance } from "@/lib/storefront/presentation";
import { money, som } from "@/lib/storefront/currency";
import type { Customer, CustomerAccountResponse } from "@/lib/storefront/types";

import styles from "./CustomerPortal.module.css";
import { ORDER_STATUS, formatDate, paymentLabel } from "./format";

const TABS = [
  { key: "profile", label: "Hisobim" },
  { key: "sales", label: "Xaridlar" },
  { key: "orders", label: "Buyurtmalar" },
  { key: "payments", label: "To‘lovlar" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className={styles.empty}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

export function CustomerPortal({ customer, onLogout }: { customer: Customer; onLogout: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const code = customer.customer_code;
  const [result, setResult] = useState<{ code: string; data?: CustomerAccountResponse; error?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/customer?code=${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Ma’lumot yuklanmadi");
        return data as CustomerAccountResponse;
      })
      .then((data) => !cancelled && setResult({ code, data }))
      .catch((cause: unknown) => {
        if (!cancelled) setResult({ code, error: cause instanceof Error ? cause.message : "Xatolik yuz berdi" });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const current = result?.code === code ? result : null;
  const data = current?.data;
  const profile = data?.customer ?? customer;
  const displayName = profile.name || profile.customer_name || code;

  return (
    <div className={styles.portal}>
      <div className={styles.head}>
        <div className={styles.identity}>
          <span className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</span>
          <div>
            <h1 className={styles.name}>{displayName}</h1>
            <p className={styles.meta}>
              {profile.code || code}
              {(profile.phone || profile.phone_number) && ` · ${profile.phone || profile.phone_number}`}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          icon={<LogOut size={16} aria-hidden />}
          onClick={() => {
            onLogout();
            router.push("/");
          }}
        >
          Chiqish
        </Button>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Hisob bo‘limlari">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={styles.tab}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel">
        {!current && <p className={styles.loading}>Yuklanmoqda...</p>}
        {current?.error && (
          <p className={styles.error} role="alert">
            {current.error}
          </p>
        )}

        {data && tab === "profile" && (
          <div className={styles.stats}>
            <div className={`${styles.stat} ${(profile.debt ?? 0) > 0 || hasCurrencyBalance(profile.currency_debts) ? styles.debt : ""}`}>
              <span className={styles.statLabel}>Qarz</span>
              <strong className={styles.statValue}>{som(profile.debt || 0)}</strong>
              {Object.entries(profile.currency_debts ?? {}).map(([currency, amount]) => (
                <span key={currency} className={styles.statExtra}>
                  {money(amount, currency)}
                </span>
              ))}
            </div>
            <div className={`${styles.stat} ${(profile.credit ?? 0) > 0 || hasCurrencyBalance(profile.currency_credits) ? styles.credit : ""}`}>
              <span className={styles.statLabel}>Ortiqcha to‘lov</span>
              <strong className={styles.statValue}>{som(profile.credit || 0)}</strong>
              {Object.entries(profile.currency_credits ?? {}).map(([currency, amount]) => (
                <span key={currency} className={styles.statExtra}>
                  {money(amount, currency)}
                </span>
              ))}
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Jami xaridlar</span>
              <strong className={styles.statValue}>
                {som((data.sales ?? []).reduce((sum, s) => sum + (s.total || 0), 0))}
              </strong>
            </div>
          </div>
        )}

        {data && tab === "sales" &&
          (!data.sales?.length ? (
            <Empty icon={<FileText size={28} aria-hidden />} text="Xaridlar yo‘q" />
          ) : (
            <ul className={styles.list}>
              {data.sales.map((s, i) => (
                <li key={s.receipt_number ?? i}>
                  <details className={styles.row}>
                    <summary className={styles.summary}>
                      <span>
                        <span className={styles.rowTitle}>{s.receipt_number || `Xarid #${i + 1}`}</span>
                        <span className={styles.rowMeta}>
                          {formatDate(s.created_at)} · <span className={styles.method} data-method={s.payment_method}>{paymentLabel(s.payment_method)}</span>
                        </span>
                      </span>
                      <span className={styles.rowRight}>
                        <strong>{som(s.total || 0)}</strong>
                        {((s.debt ?? 0) > 0 || (s.debt_currency_amount ?? 0) > 0) && <span className={styles.debtText}>Qarz: {s.debt_currency && s.debt_currency_amount ? money(s.debt_currency_amount, s.debt_currency) : som(s.debt)}</span>}
                      </span>
                    </summary>
                    <ul className={styles.saleItems}>
                      {s.items?.map((it, j) => (
                        <li key={j}>
                          <span>{it.name || it.product_name}</span>
                          <span>
                            {+(it.qty || it.quantity || 0)} {it.unit || it.unit_name || ""} × {som(it.price || 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <dl className={styles.settlement}>
                      <div><dt>Jami</dt><dd>{som(s.total || 0)}</dd></div>
                      {(s.payment_breakdown ?? []).map((payment, index) => <div key={index}><dt><span className={styles.method} data-method={payment.method}>{paymentLabel(payment.method)}</span></dt><dd>{som(payment.amount || 0)}</dd></div>)}
                      {s.paid != null && <div><dt>To‘landi</dt><dd className={styles.paid}>{som(s.paid)}</dd></div>}
                      {(s.debt != null || s.debt_currency_amount != null) && <div className={styles.debtText}><dt>Qolgan qarz</dt><dd>{s.debt_currency && s.debt_currency_amount ? money(s.debt_currency_amount, s.debt_currency) : som(s.debt || 0)}</dd></div>}
                      {s.debt_currency && (s.debt_currency_amount ?? 0) > 0 && <div><dt>Qarz {s.debt_currency} da yozildi</dt><dd>{s.debt_rate != null && <>Kurs: {som(s.debt_rate)}</>}{s.debt != null && <> · ≈ {som(s.debt)}</>}</dd></div>}
                    </dl>
                  </details>
                </li>
              ))}
            </ul>
          ))}

        {data && tab === "orders" &&
          (!data.online_orders?.length ? (
            <Empty icon={<Package size={28} aria-hidden />} text="Onlayn buyurtmalar yo‘q" />
          ) : (
            <ul className={styles.list}>
              {data.online_orders.map((o, i) => {
                const status = ORDER_STATUS[o.status ?? ""] ?? { label: o.status || "—", tone: "muted" as const };
                return (
                  <li key={o.order_no ?? i} className={`${styles.row} ${styles.summary}`}>
                    <span>
                      <span className={styles.rowTitle}>{o.order_no || `Buyurtma #${i + 1}`}</span>
                      <span className={styles.rowMeta}>{formatDate(o.created_at)}</span>
                    </span>
                    <span className={styles.rowRight}>
                      <strong>{som(o.total || 0)}</strong>
                      <span className={`${styles.status} ${styles[status.tone]}`}>{status.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ))}

        {data && tab === "payments" &&
          (!data.payments?.length ? (
            <Empty icon={<CreditCard size={28} aria-hidden />} text="To‘lovlar yo‘q" />
          ) : (
            <ul className={styles.list}>
              {data.payments.map((p, i) => (
                <li key={i} className={`${styles.row} ${styles.summary}`}>
                  <span>
                    <span className={styles.rowTitle}>{formatDate(p.created_at)}</span>
                    {p.note && <span className={styles.rowMeta}>{p.note}</span>}
                  </span>
                  <strong className={styles.paid}>+{money(p.amount || 0, p.currency)}</strong>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
