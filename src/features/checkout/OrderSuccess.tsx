"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useDialogA11y } from "@/lib/dialog";

import styles from "./OrderSuccess.module.css";

export function OrderSuccess({ orderNo, summary, onClose }: { orderNo: string; summary?: string; onClose: () => void }) {
  const dialogRef = useDialogA11y(true, onClose);
  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={styles.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="order-success-title"
        tabIndex={-1}
      >
        <span className={styles.icon}>
          <Check size={32} aria-hidden />
        </span>
        <h2 id="order-success-title" className={styles.title}>
          Buyurtma qabul qilindi!
        </h2>
        <p className={styles.label}>Buyurtma raqami</p>
        <p className={styles.number}>{orderNo}</p>
        {summary && <p className={styles.summary}>Buyurtmangiz: {summary}</p>}
        <p className={styles.text}>
          Do‘kon buyurtmani tekshirib, yetkazib berish vaqtini kelishish uchun tez orada qo‘ng‘iroq qiladi. Xaridingiz uchun rahmat!
        </p>
        <Button size="lg" block onClick={onClose}>
          Xaridni davom ettirish
        </Button>
      </div>
    </div>
  );
}
