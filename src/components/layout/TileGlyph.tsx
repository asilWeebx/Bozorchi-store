/** A tile size drawn to scale as a small outline (60×120 is a tall plank, 60×60 a square), for size links. */
export function TileGlyph({ a, b, size = 18 }: { a: number; b: number; size?: number }) {
  const long = Math.max(a, b);
  const w = (size * Math.min(a, b)) / long;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <rect x={(size - w) / 2 + 0.75} y={0.75} width={Math.max(2, w - 1.5)} height={size - 1.5} rx={1} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}
