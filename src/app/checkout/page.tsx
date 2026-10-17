import type { Metadata } from "next";

import { BackButton } from "@/components/layout/NavActions";
import { Container } from "@/components/ui/Container";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Rasmiylashtirish" };

export default function CheckoutPage() {
  return (
    <Container className={styles.page}>
      <BackButton fallback="/cart" />
      <CheckoutForm />
    </Container>
  );
}
