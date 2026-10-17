"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { TileArt } from "@/components/product/TileArt";
import { SafeImage } from "@/components/ui/SafeImage";
import { displayPrice, productOptions } from "@/lib/shop/options";
import { tileCaption, tileFacts } from "@/lib/shop/tiles";
import { finishFacets, matchesSearch, searchSuggestions, sizeFacets } from "@/lib/storefront/catalog";
import { useCatalog } from "@/lib/storefront/CatalogProvider";
import { priceText } from "@/lib/storefront/currency";

import styles from "./SearchBox.module.css";

/**
 * Search by code, article, size ("60x120", "60*120", "60х120") or surface
 * ("glans", "mat", "глянец"), with suggestions as you type. Enter opens the
 * full results on the catalog page.
 */
export function SearchBox({ expanded = false, compact = false, onNavigate }: { expanded?: boolean; compact?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const { products } = useCatalog();
  // Quick searches on an empty search: the commonest sizes, then the surfaces.
  const popular = useMemo(
    () => [
      ...[...sizeFacets(products)]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((s) => s.label),
      ...finishFacets(products).map((f) => f.label),
    ],
    [products],
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Safari, every iPhone browser and Firefox on Mac don't focus a tapped link,
   * so the input's blur can't tell a tap on a result from a tap elsewhere.
   * Closing on blur unmounted the results before the tap landed; a press
   * outside the form is what closes them instead.
   */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const trimmed = query.trim();
  const { results, exact } = useMemo(() => {
    if (!trimmed) return { results: [], exact: true };
    const found = products.filter((p) => matchesSearch(p, trimmed));
    return found.length ? { results: found.slice(0, 6), exact: true } : { results: searchSuggestions(trimmed, products, 6), exact: false };
  }, [products, trimmed]);

  const go = (value = trimmed) => {
    setOpen(false);
    inputRef.current?.blur();
    router.push(value ? `/catalog?q=${encodeURIComponent(value)}` : "/catalog");
    onNavigate?.();
  };

  return (
    <form
      ref={formRef}
      role="search"
      className={[styles.form, expanded && styles.expanded, compact && styles.compact].filter(Boolean).join(" ")}
      onSubmit={(event) => {
        event.preventDefault();
        go();
      }}
      onBlur={(event) => {
        // Only a focus move that names its target (Tab) closes; see above.
        const next = event.relatedTarget;
        if (next && !event.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <Search size={18} className={styles.icon} aria-hidden />
      <input
        ref={inputRef}
        data-autofocus={expanded ? "" : undefined}
        className={styles.input}
        type="search"
        name="q"
        enterKeyHint="search"
        placeholder={compact ? "Kod yoki o‘lcham..." : "Kod, o‘lcham yoki sirt: «8230», «60x120», «glans»"}
        aria-label="Qidirish"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && Boolean(trimmed)}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {query && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Tozalash"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
        >
          <X size={16} aria-hidden />
        </button>
      )}

      {expanded && !trimmed && popular.length > 0 && (
        <div className={styles.popular}>
          <p className={styles.note}>Ko‘p qidiriladi</p>
          <div className={styles.chips}>
            {popular.map((word) => (
              <button key={word} type="button" className={styles.chip} onClick={() => go(word)}>
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && trimmed && (
        <div id={listId} className={styles.panel}>
          {results.length === 0 ? (
            <p className={styles.note}>Hech narsa topilmadi</p>
          ) : (
            <>
              {!exact && <p className={styles.note}>Aniq mos kelmadi. Balki shular:</p>}
              <ul>
                {results.map((p) => {
                  const price = displayPrice(productOptions(p));
                  const facts = tileFacts(p);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.id}`}
                        className={styles.result}
                        onClick={() => {
                          setOpen(false);
                          inputRef.current?.blur();
                          onNavigate?.();
                        }}
                      >
                        <span className={styles.thumb}>
                          <SafeImage src={p.image} alt="" sizes="48px" className={styles.photo} fallback={<TileArt size={facts.size} label={false} />} />
                        </span>
                        <span className={styles.resultText}>
                          <span className={styles.resultName}>{p.name}</span>
                          {price && (
                            <span className={styles.resultMeta}>
                              {priceText(price.option.curPrice, price.option.currency)}
                              {price.varies ? " dan" : ""} / {price.option.unit}
                              {tileCaption(facts) ? ` · ${tileCaption(facts)}` : ""}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {exact && (
                <button type="submit" className={styles.all}>
                  Barcha natijalar
                </button>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}
