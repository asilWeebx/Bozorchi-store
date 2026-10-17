import { Banknote, Ruler, Truck, UserRound } from "lucide-react";

import { Container } from "@/components/ui/Container";

import styles from "./Perks.module.css";

/** How buying works here, in four lines. Only what the site and checkout really offer. */
const PERKS = [
  { Icon: Ruler, title: "Narx m² hisobida", text: "qutida necha dona va m² borligi ko‘rinadi" },
  { Icon: Truck, title: "Yetkazib beramiz", text: "yoki do‘kondan o‘zingiz olasiz" },
  { Icon: Banknote, title: "Naqd yoki karta", text: "buyurtmani qabul qilganda" },
  { Icon: UserRound, title: "Mijoz kabineti", text: "xaridlar va hisob-kitob, ID orqali" },
];

export function Perks() {
  return (
    <Container>
      <ul className={styles.perks}>
        {PERKS.map(({ Icon, title, text }) => (
          <li key={title} className={styles.perk}>
            <span className={styles.icon}>
              <Icon size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <strong>{title}</strong>
              <span className={styles.text}>{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Container>
  );
}
