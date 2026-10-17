"use client";

import { Calculator, Check, Info, ShoppingBag, Warehouse } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useShopUi } from "@/components/layout/ShopUi";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Stepper } from "@/components/ui/Stepper";
import { cartFeedback } from "@/lib/cart/feedback";
import { capFor, lineKey, packText } from "@/lib/cart/lines";
import { clampQty, commitQty, stepQty, type Limits } from "@/lib/cart/quantity";
import { useCart } from "@/lib/cart/useCart";
import { toGrain, type BuyOption } from "@/lib/shop/options";
import { tileFacts } from "@/lib/shop/tiles";
import { useCatalog } from "@/lib/storefront/CatalogProvider";
import { fmtNumber, priceText, som } from "@/lib/storefront/currency";
import type { Product } from "@/lib/storefront/types";

import styles from "./BuyBox.module.css";

/** What an amount of this option is, for people: "3 quti + 2 dona". */
function packOf(option: BuyOption, qty: number, pieceArea: number | null): string {
  return packText({
    qty,
    measure: option.measure,
    piece_area: option.measure === "area" ? pieceArea : null,
    box_pieces: option.box?.pieces ?? null,
  });
}

const parseMetres = (text: string) => {
  const value = Number(text.replace(",", ".").trim());
  return Number.isFinite(value) && value > 0 ? value : null;
};

/** Spare tiles for cuts and breakage, as a share of the area. */
const RESERVES = [0, 5, 10, 15];

/**
 * "How many m² do I need": a floor's (or wall's) length × width, plus a
 * spare share for cuts, rounded up to whole tiles. Folded away until asked
 * for.
 */
function AreaHelper({ limits, unit, onApply, pack }: { limits: Limits; unit: string; onApply: (qty: number) => void; pack: (qty: number) => string }) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [reserve, setReserve] = useState(10);
  const l = parseMetres(length);
  const w = parseMetres(width);
  const needed = l && w ? l * w * (1 + reserve / 100) : null;
  const qty = needed ? clampQty(needed, limits) : null;
  const short = needed != null && qty != null && qty + 1e-6 < toGrain(needed, limits.grain ?? 0.01, "up");

  return (
    <details className={styles.helper}>
      <summary>
        <Calculator size={18} aria-hidden />
        Necha m² kerakligini hisoblash
      </summary>
      <div className={styles.helperBody}>
        <div className={styles.helperFields}>
          <label>
            <span>Uzunligi, m</span>
            <input inputMode="decimal" value={length} onChange={(event) => setLength(event.target.value)} placeholder="4" />
          </label>
          <span aria-hidden>×</span>
          <label>
            <span>Eni (yoki balandligi), m</span>
            <input inputMode="decimal" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="3.5" />
          </label>
        </div>
        <div className={styles.reserves} role="radiogroup" aria-label="Zaxira">
          <span>Zaxira (kesish uchun):</span>
          {RESERVES.map((value) => (
            <button key={value} type="button" role="radio" aria-checked={reserve === value} onClick={() => setReserve(value)}>
              {value}%
            </button>
          ))}
        </div>
        {needed != null && qty != null && (
          <div className={styles.helperResult}>
            <p>
              Kerak: <strong>{fmtNumber(needed)} m²</strong>
              {qty > 0 && (
                <>
                  {" "}→ {fmtNumber(qty)} {unit}
                  {pack(qty) && <> ({pack(qty)})</>}
                </>
              )}
            </p>
            {short && <p className={styles.helperShort}>Omborda shuncha bor; qolganini do‘kon bilan kelishing.</p>}
            <Button size="sm" variant="secondary" onClick={() => onApply(qty)}>
              Shu miqdorni tanlash
            </Button>
          </div>
        )}
      </div>
    </details>
  );
}

/**
 * Price, amount and "add to cart" for the chosen tile (or model). Amounts are
 * in m², always whole tiles; + and − move by whole boxes, and the box and
 * tile count and the weight are shown as the amount changes. What the cart
 * already holds counts against the stock.
 */
export function BuyBox({ product, option, onAdded }: { product: Product; option: BuyOption; onAdded?: () => void }) {
  const { showStock } = useCatalog();
  const { items, ready, add } = useCart();
  const { open } = useShopUi();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pieceArea } = tileFacts(product);
  const inCart = items.find((x) => x.key === lineKey(product.id, option.key));
  const left = Math.max(0, toGrain(capFor(option) - (inCart?.qty ?? 0), option.grain, "down"));
  const [qty, setQty] = useState(option.step);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [added]);

  const finished = option.inStock && ready && left < option.min;
  const limits: Limits = { min: option.min, grain: option.grain, step: option.step, max: left };
  const value = clampQty(qty, limits);
  const pack = (amount: number) => packOf(option, amount, pieceArea);
  const area = option.measure === "area";
  const decimal = option.measure !== "piece";
  const weight = option.weightPerUnit ? value * option.weightPerUnit : null;
  // A part box can be rounded up to a whole one, when the stock has it.
  const wholeBoxes = option.box && area ? toGrain(Math.ceil(value / option.box.qty - 1e-6) * option.box.qty, option.grain, "nearest") : null;
  const canRound = wholeBoxes != null && wholeBoxes > value && wholeBoxes <= left;
  const stockPieces = area && pieceArea && Number.isFinite(option.stock) ? Math.round(option.stock / pieceArea) : null;

  return (
    <section className={styles.box} aria-label="Xarid">
      <Price
        amount={option.curPrice}
        currency={option.currency}
        inSom={option.price}
        original={option.curOriginalPrice}
        per={option.unit}
        box={option.box && area ? { qty: option.box.qty, unit: option.unit } : null}
        size="xl"
      />

      <p className={`${styles.stock} ${!option.inStock ? styles.out : ""}`}>
        <Warehouse size={18} strokeWidth={2} aria-hidden />
        {!option.inStock
          ? "Hozir sotuvda yo‘q"
          : showStock && Number.isFinite(option.stock)
            ? `Omborda: ${fmtNumber(option.stock)} ${option.unit}${stockPieces ? ` (${fmtNumber(stockPieces)} dona)` : ""}`
            : "Sotuvda bor"}
      </p>

      {option.inStock && !finished && (
        <>
          {area && <AreaHelper limits={limits} unit={option.unit} pack={pack} onApply={setQty} />}

          <div className={styles.row}>
            <Stepper
              decimal={decimal}
              label={`${product.name}: miqdori, ${option.unit}`}
              value={value}
              suffix={option.unit}
              canDecrease={stepQty(value, -1, limits) < value}
              canIncrease={stepQty(value, 1, limits) > value}
              onStep={(direction) => setQty(stepQty(value, direction, limits))}
              onCommit={(draft) => {
                const next = commitQty(draft, limits);
                if (next != null) setQty(next);
              }}
            />
            <p className={styles.total}>
              <span>{[pack(value), weight ? `≈ ${fmtNumber(Math.round(weight))} kg` : ""].filter(Boolean).join(" · ") || `${fmtNumber(value)} ${option.unit}`}</span>
              <strong>{priceText(option.currency === "USD" ? Math.round(option.curPrice * value * 100) / 100 : Math.round(option.price * value), option.currency)}</strong>
              {option.currency === "USD" && <span>≈ {som(option.price * value)}</span>}
            </p>
          </div>

          {canRound && (
            <button type="button" className={styles.round} onClick={() => setQty(wholeBoxes!)}>
              Butun qutiga yaxlitlash: {fmtNumber(wholeBoxes!)} {option.unit} ({pack(wholeBoxes!)})
            </button>
          )}

          <Button
            ref={buttonRef}
            size="lg"
            block
            icon={added ? <Check size={20} aria-hidden /> : <ShoppingBag size={20} aria-hidden />}
            onClick={() => {
              add(product, option, value);
              cartFeedback(buttonRef.current);
              setAdded(true);
              setQty(option.step);
              onAdded?.();
            }}
          >
            {added ? "Savatga qo‘shildi" : "Savatga qo‘shish"}
          </Button>

          {area && pieceArea && (
            <p className={styles.boxNote}>
              <Info size={18} aria-hidden />
              <span>
                Narx 1 m² uchun. Kafel butun dona bo‘lib beriladi, shuning uchun miqdor eng yaqin butun donaga yaxlitlanadi
                {option.box ? <>: 1 quti = {fmtNumber(option.box.pieces)} dona = {fmtNumber(option.box.qty)} m²</> : <> (1 dona = {fmtNumber(pieceArea)} m²)</>}.
              </span>
            </p>
          )}
        </>
      )}

      {finished && <p className={styles.finished}>Ombordagi barcha miqdor savatingizda.</p>}

      {inCart && (
        <button type="button" className={styles.inCart} onClick={() => open("cart")}>
          <span>
            Savatda:{" "}
            <strong>
              {fmtNumber(inCart.qty)} {inCart.unit}
              {packText(inCart) && ` · ${packText(inCart)}`}
            </strong>
          </span>
          <span className={styles.inCartLink}>Savatni ochish →</span>
        </button>
      )}
    </section>
  );
}
