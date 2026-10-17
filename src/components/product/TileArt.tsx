import type { TileSize } from "@/lib/shop/tiles";

import styles from "./TileArt.module.css";

const VIEW = 120;

/**
 * Stands in for a missing photo (most of the catalog has none): the tile
 * laid out to its real proportions, long tiles in a running bond, with its
 * size on it. Neutral stone colour, since the real colour is unknown.
 */
export function TileArt({ size, glossy = false, label = true }: { size?: Pick<TileSize, "a" | "b" | "label"> | null; glossy?: boolean; label?: boolean }) {
  const long = size ? Math.max(size.a, size.b) : 60;
  const short = size ? Math.min(size.a, size.b) : 60;
  // About two and a bit tiles across, whatever the size; the shape tells the format.
  const w = VIEW / 2.25;
  const h = Math.max(6, (w * short) / long);
  const offset = long === short ? 0 : w / 2;
  const tiles: { x: number; y: number }[] = [];
  for (let row = 0, y = -h / 3; y < VIEW; row++, y += h) {
    for (let x = -((row * offset) % w); x < VIEW; x += w) tiles.push({ x, y });
  }

  return (
    <span className={styles.art} aria-hidden>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="xMidYMid slice" className={styles.svg}>
        <defs>
          <linearGradient id="tile-stone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f0ea" />
            <stop offset="1" stopColor="#e2dace" />
          </linearGradient>
          <linearGradient id="tile-gloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.65" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={VIEW} height={VIEW} className={styles.grout} />
        {tiles.map(({ x, y }) => (
          <rect key={`${x.toFixed(1)}-${y.toFixed(1)}`} x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} rx={0.6} fill="url(#tile-stone)" />
        ))}
        {glossy && <rect width={VIEW} height={VIEW} fill="url(#tile-gloss)" />}
      </svg>
      {label && size && <span className={styles.size}>{size.label}</span>}
    </span>
  );
}
