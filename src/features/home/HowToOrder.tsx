import { Container } from "@/components/ui/Container";

import styles from "./HowToOrder.module.css";
import { SectionHeading } from "./SectionHeading";

const STEPS = [
  { title: "Tanlang", text: "Bo‘lim, o‘lcham va sirt bo‘yicha kafelni tanlang, kerakli m² ni yozing yoki xona o‘lchamidan hisoblang." },
  { title: "Rasmiylashtiring", text: "Ism va telefoningizni yozing, manzilni xaritada belgilang yoki do‘kondan o‘zingiz olib keting." },
  { title: "Qo‘ng‘iroqni kuting", text: "Do‘kon buyurtmani tasdiqlash, yetkazib berish narxi va vaqtini kelishish uchun bog‘lanadi." },
  { title: "Qabul qiling", text: "To‘lov naqd yoki karta orqali, kafelni qabul qilganda." },
];

export function HowToOrder() {
  return (
    <Container className={styles.section}>
      <SectionHeading title="Qanday buyurtma beriladi" />
      <ol className={styles.steps}>
        {STEPS.map((step, i) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className={styles.title}>{step.title}</h3>
            <p className={styles.text}>{step.text}</p>
          </li>
        ))}
      </ol>
    </Container>
  );
}
