import assert from "node:assert/strict";
import test from "node:test";

import {
  addLine,
  cartTotal,
  cartWeight,
  lineCurTotal,
  packText,
  revalidateCart,
  sanitizeStoredCart,
  setLineQty,
  stockProblems,
  toOrderItems,
  UNLIMITED,
} from "../src/lib/cart/lines.ts";
import { clampQty, commitQty, stepQty } from "../src/lib/cart/quantity.ts";
import { summarizeCart } from "../src/lib/cart/totals.ts";
import { productOptions } from "../src/lib/shop/options.ts";
import type { Product } from "../src/lib/storefront/types.ts";

import { ROWS } from "./fixtures.ts";

const glans = ROWS.glans001;
const [glansOption] = productOptions(glans);
const tiles = { min: 0.36, grain: 0.36, step: 1.44, max: 368.28 };

test("typed m² round up to whole tiles and stop at the stock", () => {
  assert.equal(clampQty(10, tiles), 10.08, "10 m² of 60×60 is 28 tiles");
  assert.equal(clampQty(0.1, tiles), 0.36, "never below one tile");
  assert.equal(clampQty(1000, tiles), 368.28);
  assert.equal(commitQty("2,5", tiles), 2.52, "a comma works as the decimal point");
  assert.equal(commitQty("", tiles), null);
  assert.equal(commitQty("abc", tiles), null);
});

test("+ and − move to the next whole box", () => {
  assert.equal(stepQty(3.6, 1, tiles), 4.32, "2.5 boxes → 3");
  assert.equal(stepQty(3.6, -1, tiles), 2.88, "2.5 boxes → 2");
  assert.equal(stepQty(1.44, -1, tiles), 0.36, "below one box, down to one tile");
  assert.equal(stepQty(0.36, -1, tiles), 0.36, "unchanged at the minimum: a cart line removes itself");
  assert.equal(stepQty(368.28, 1, tiles), 368.28, "unchanged at the stock");
  assert.equal(stepQty(367.2, 1, tiles), 368.28, "the last part box is what is left");
});

test("adding a box of 60×60 tiles, then typing an area", () => {
  let cart = addLine([], glans, glansOption, glansOption.step);
  assert.equal(cart[0].qty, 1.44);
  assert.equal(cart[0].unit, "m²");
  assert.equal(cart[0].caption, "60×60 · Glans");
  assert.equal(packText(cart[0]), "1 quti");

  cart = setLineQty(cart, cart[0].key, 10);
  assert.equal(cart[0].qty, 10.08);
  assert.equal(packText(cart[0]), "7 quti");

  cart = setLineQty(cart, cart[0].key, 3.6);
  assert.equal(packText(cart[0]), "2 quti + 2 dona");
  assert.equal(cartTotal(cart), Math.round(3.6 * 52000));

  assert.deepEqual(cartWeight(cart), { kg: 70, partial: false }, "2.5 boxes of 28 kg");
});

test("what the ERP is sent: m² with decimals, a model's variant id, never a unit id", () => {
  const cart = addLine([], glans, glansOption, 3.6);
  assert.deepEqual(toOrderItems(cart), [{ product_id: 1066, qty: 3.6 }]);
});

test("a dollar-priced tile is totalled in dollars, and the cart in so'm at the shop's rate", () => {
  const usd = ROWS.usd02R36;
  let cart = addLine([], usd, productOptions(usd)[0], 2.88);
  assert.equal(lineCurTotal(cart[0]), 18.14);
  cart = addLine(cart, glans, glansOption, 1.44);
  const summary = summarizeCart(cart);
  assert.equal(summary.total, "$18.14 + 74 880 so'm");
  assert.equal(summary.inSom, "≈ 294 422 so'm, 1 $ = 12 100 so‘m");
  assert.equal(summary.weight, "≈ 84 kg");
});

test("a so'm-only cart has one total and no rate", () => {
  const summary = summarizeCart(addLine([], glans, glansOption, 1.44));
  assert.equal(summary.total, "74 880 so'm");
  assert.equal(summary.inSom, null);
});

test("pieces: stair steps count whole steps and weigh 20 kg each", () => {
  const zina = ROWS.zina;
  const [option] = productOptions(zina);
  const cart = addLine([], zina, option, 3);
  assert.equal(cart[0].qty, 3);
  assert.equal(packText(cart[0]), "1 quti + 1 dona");
  assert.deepEqual(cartWeight(cart), { kg: 60, partial: false });
});

test("a tile without box figures is still whole tiles, but its weight is unknown", () => {
  const bare = ROWS.noAttrs7234;
  const cart = addLine([], bare, productOptions(bare)[0], 1);
  assert.equal(cart[0].qty, 1.44, "two 60×120 tiles");
  assert.equal(packText(cart[0]), "2 dona");
  assert.deepEqual(cartWeight(cart), { kg: 0, partial: true });
});

test("sold-out tiles can't be added; saved lines are re-checked against the catalog", () => {
  const series = ROWS.series3202;
  assert.deepEqual(addLine([], series, productOptions(series)[0], 1), []);

  const saved = addLine([], glans, glansOption, 10);
  const shrunk = { ...glans, stock: 3.6 } as Product;
  const next = revalidateCart(saved, [shrunk]);
  assert.equal(next[0].qty, 3.6);
  assert.equal(next[0].max_qty, 3.6);
  assert.deepEqual(revalidateCart(saved, [{ ...glans, in_stock: false, stock: 0 } as Product]), []);
});

test("orders over stock are refused with a clear message", () => {
  assert.deepEqual(stockProblems([{ product_id: 1066, qty: 400 }], [glans]), ["001: omborda 368.28 m² qoldi, siz 400 m² so‘radingiz"]);
  assert.deepEqual(stockProblems([{ product_id: 1066, qty: 368.28 }], [glans]), []);
  assert.deepEqual(stockProblems([{ product_id: 1106, variant_id: 2304, qty: 1 }], [ROWS.series3202]), ["3202 · Model A: hozir sotuvda yo‘q"]);
});

test("a stored cart is cleaned of malformed lines and duplicates", () => {
  const good = addLine([], glans, glansOption, 1.44)[0];
  const cleaned = sanitizeStoredCart([good, { ...good }, { product_id: "x", qty: 1 }, null, { ...good, key: "other", option_key: "v1", max_qty: undefined }]);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[1].max_qty, UNLIMITED);
  assert.equal(cleaned[1].measure, "area");
  assert.deepEqual(sanitizeStoredCart("nonsense"), []);
});

test("clinker: a box of 38 small tiles is exactly its 0.6 m², and the stock is whole tiles", () => {
  const clinker = ROWS.klinker;
  const [option] = productOptions(clinker);
  assert.equal(option.step, 0.6);
  assert.equal(clampQty(option.step, option), 0.6, "not 0.616 from a rounded tile area");
  assert.equal(option.stock, 404.4);
  const cart = addLine([], clinker, option, option.step);
  assert.equal(packText(cart[0]), "1 quti");
});
