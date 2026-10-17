import { Container } from "@/components/ui/Container";

import styles from "./loading.module.css";

export default function Loading() {
  return (
    <Container className={styles.page} aria-busy="true" aria-label="Yuklanmoqda">
      <div className={styles.title} />
      <div className={styles.grid}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.card} />
        ))}
      </div>
    </Container>
  );
}
