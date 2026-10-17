import { Container } from "@/components/ui/Container";
import { boxIsConsistent, tileFacts } from "@/lib/shop/tiles";
import { fmtNumber } from "@/lib/storefront/currency";
import type { Product } from "@/lib/storefront/types";

import styles from "./PackGuide.module.css";
import { SectionHeading } from "./SectionHeading";

interface PackRow {
  size: string;
  pieces: number;
  area: number;
  weight: number | null;
}

/**
 * What one box of each size holds, as the ERP records it: the most common
 * figures per size, from boxes whose numbers add up.
 */
export function packRows(products: Product[]): PackRow[] {
  const bySize = new Map<string, Map<string, { row: PackRow; count: number }>>();
  for (const p of products) {
    const facts = tileFacts(p);
    if (!facts.size || !facts.box || !boxIsConsistent(facts)) continue;
    const row = { size: facts.size.label, pieces: facts.box.pieces, area: facts.box.area, weight: facts.box.weight };
    const key = `${row.pieces}|${row.area}|${row.weight}`;
    const rows = bySize.get(row.size) ?? new Map();
    const seen = rows.get(key) ?? { row, count: 0 };
    seen.count++;
    rows.set(key, seen);
    bySize.set(row.size, rows);
  }
  return [...bySize.values()]
    .map((rows) => [...rows.values()].sort((a, b) => b.count - a.count)[0].row)
    .sort((a, b) => a.area / a.pieces - b.area / b.pieces);
}

/**
 * How tiles are priced and packed: per m², in whole tiles, boxes of a known
 * size; with each format's box from the shop's own data.
 */
export function PackGuide({ products }: { products: Product[] }) {
  const rows = packRows(products);
  if (!rows.length) return null;

  return (
    <Container className={styles.section} id="qadoq">
      <div className={styles.panel}>
        <div className={styles.copy}>
          <SectionHeading title="Narx va qadoq" tone="dark" />
          <ul className={styles.points}>
            <li>
              <strong>Narx 1 m² uchun.</strong> Savatga m² yoziladi, jami narx shundan hisoblanadi.
            </li>
            <li>
              <strong>Kafel butun dona bo‘lib beriladi:</strong> miqdor eng yaqin butun donaga yaxlitlanadi, + va − tugmalari bir qutiga
              o‘zgartiradi.
            </li>
            <li>
              <strong>Zaxira.</strong> Kesish va singan donalar uchun odatda 5–10% ko‘proq olinadi. Mahsulot sahifasida xona o‘lchamidan
              hisoblash mumkin.
            </li>
          </ul>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Bir qutida nechta dona, necha m² va qancha og‘irlik</caption>
            <thead>
              <tr>
                <th scope="col">O‘lcham, sm</th>
                <th scope="col">Qutida</th>
                <th scope="col">m²</th>
                <th scope="col">Og‘irligi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.size}>
                  <th scope="row">{row.size}</th>
                  <td>{fmtNumber(row.pieces)} dona</td>
                  <td>{fmtNumber(row.area)}</td>
                  <td>{row.weight ? `${fmtNumber(row.weight)} kg` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
