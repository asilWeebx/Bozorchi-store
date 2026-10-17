import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { AccountView } from "@/features/account/AccountView";

import styles from "./page.module.css";

export const metadata: Metadata = { title: "Shaxsiy kabinet" };

export default function AccountPage() {
  return (
    <Container className={styles.page}>
      <AccountView />
    </Container>
  );
}
