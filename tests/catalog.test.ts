import assert from "node:assert/strict";
import test from "node:test";

import { displayPrice, productOptions, variantName } from "../src/lib/shop/options.ts";
import { productSpecs } from "../src/lib/shop/specs.ts";
import { boxIsConsistent, parseFinish, parseSize, tileFacts } from "../src/lib/shop/tiles.ts";
import {
  buildCategories,
  categoryLabel,
  filterProducts,
  finishFacets,
  matchesSearch,
  NO_FILTERS,
  normalizeCategories,
  productMaker,
  searchSuggestions,
  similarProducts,
  sizeFacets,
  sizeFromParam,
  sizeParam,
} from "../src/lib/storefront/catalog.ts";
import { usdRate } from "../src/lib/storefront/currency.ts";
import { shopLinks } from "../src/lib/storefront/nav.ts";

import { ALL } from "./fixtures.ts";

const catalog = normalizeCategories(ALL);
const byName = (name: string) => catalog.find((p) => p.name === name)!;
const names = (list: { name: string }[]) => list.map((p) => p.name);

test("a polished tile three levels deep sits under its maker, its parent learnt from another row", () => {
  const polished = byName("92050");
  assert.equal(polished.category_parent_id, 48);
  assert.equal(polished.category_parent_name, "Sirdaryo kafel");
  assert.equal(polished.category_name, "60x60 GLANS › 60X60 PALIROVKA");
  assert.equal(productMaker(polished), "Sirdaryo kafel");

  const categories = buildCategories(catalog);
  const polishedSection = categories.find((c) => c.id === 92)!;
  assert.equal(polishedSection.parentId, 48);
  assert.equal(polishedSection.label, "60×60 palirovka");
  assert.equal(categories.find((c) => c.id === 52)!.label, "Qo‘qon kafel", "o' gets the proper mark");
  assert.equal(categories.find((c) => c.id === 529)!.parentId, null, "XIT has no parent and is a top category");
});

test("category labels: sizes get a times sign, words are sentence case", () => {
  assert.deepEqual(categoryLabel("60X120 MAT"), { label: "60×120 mat", note: "" });
  assert.deepEqual(categoryLabel("TASHKENT"), { label: "Tashkent", note: "" });
});

test("tile sizes and surfaces are read from attributes, categories or descriptions", () => {
  assert.deepEqual(parseSize("24.5X6.5"), { a: 24.5, b: 6.5, label: "24.5×6.5", area: 0.015925 });
  assert.equal(parseSize("60х60")?.label, "60×60", "Cyrillic х");
  assert.equal(parseSize("60*120")?.label, "60×120");
  assert.equal(parseFinish("60X120 MAT")?.id, "mat");
  assert.equal(parseFinish("MATERIAL"), null, "MAT inside a word is not a surface");
  assert.equal(parseFinish("Глянцевый")?.id, "glans");

  const glans = tileFacts(byName("001"));
  assert.equal(glans.size?.label, "60×60");
  assert.equal(glans.finish?.id, "glans");
  assert.deepEqual(glans.box, { area: 1.44, pieces: 4, weight: 28 });
  assert.equal(glans.pieceArea, 0.36);

  const bare = tileFacts(byName("7234"));
  assert.equal(bare.size?.label, "60×120", "from the category name");
  assert.equal(bare.box, null);
  assert.equal(bare.pieceArea, 0.72);

  assert.equal(tileFacts(byName("92050")).finish?.id, "polirovka", "the nearest category wins over its parent's GLANS");
});

test("a box whose figures don't add up keeps the size's tile area and is not used for boxes", () => {
  const odd = byName("205");
  const facts = tileFacts(odd);
  assert.equal(facts.pieceArea, 0.18, "30×60, not the 0.36 that 1.44 m² over 4 tiles would give");
  assert.equal(boxIsConsistent(facts), false);
  const [option] = productOptions(odd);
  assert.equal(option.box, null);
  assert.equal(option.step, 0.18, "+ and − move by a tile instead");
});

test("tiles are sold per m² in whole tiles, stepped by boxes; stock is whole tiles", () => {
  const [option] = productOptions(byName("001"));
  assert.equal(option.unit, "m²");
  assert.equal(option.measure, "area");
  assert.equal(option.grain, 0.36);
  assert.equal(option.step, 1.44);
  assert.equal(option.stock, 368.28, "368.36 m² in the ERP is 1023 whole tiles");
  assert.ok(Math.abs(option.weightPerUnit! - 28 / 1.44) < 1e-9);
  assert.equal(option.currency, "");
  assert.equal(option.curPrice, option.price);
});

test("a dollar-priced tile keeps its dollar price and the ERP's so'm one", () => {
  const [option] = productOptions(byName("02R36"));
  assert.equal(option.currency, "USD");
  assert.equal(option.curPrice, 6.3);
  assert.equal(option.price, 76230);
  assert.equal(usdRate([option]), 12100);
});

test("pieces are whole numbers and their box is counted in pieces", () => {
  const [steps] = productOptions(byName("SERIY ZINA"));
  assert.equal(steps.unit, "dona");
  assert.equal(steps.grain, 1);
  assert.equal(steps.step, 1);
  assert.deepEqual(steps.box, { qty: 2, pieces: 2, area: 2, weight: 40 });
  assert.equal(steps.weightPerUnit, 20);
});

test("a series' models are named without the ERP's prefix", () => {
  assert.deepEqual(variantName({ name: "MADEL: A", options: [] }), { legend: "Model", value: "A" });
  const options = productOptions(byName("3202"));
  assert.deepEqual(
    options.map((o) => [o.legend, o.label, o.unit]),
    [
      ["Model", "A", "m²"],
      ["Model", "B", "m²"],
      ["Model", "C", "m²"],
      ["Model", "F", "m²"],
    ],
  );
  assert.ok(options.every((o) => !o.inStock));
});

test("the card price is the cheapest in stock, compared in so'm across currencies", () => {
  const price = displayPrice(productOptions(byName("02R36")));
  assert.equal(price?.option.curPrice, 6.3);
  assert.equal(price?.varies, false);
});

test("search understands sizes however they are typed, surfaces in Russian and generic tile words", () => {
  assert.ok(matchesSearch(byName("001"), "60x60"));
  assert.ok(matchesSearch(byName("001"), "60*60"));
  assert.ok(matchesSearch(byName("001"), "60 х 60"), "Cyrillic х with spaces");
  assert.ok(matchesSearch(byName("7234"), "plitka 60х120 глянец"));
  assert.ok(!matchesSearch(byName("7234"), "mat"));
  assert.ok(matchesSearch(byName("SERIY ZINA"), "ступени"));
  assert.ok(matchesSearch(byName("3202"), "madel a"));
  assert.deepEqual(names(searchSuggestions("9205", catalog)).slice(0, 1), ["92050"], "a partial code still finds the tile");
});

test("filters: size, surface, maker, in stock only", () => {
  assert.deepEqual(names(filterProducts(catalog, { ...NO_FILTERS, size: "60×60", finish: "polirovka" })).sort(), ["90022", "92050", "92056", "BT02"]);
  const inStock = names(filterProducts(catalog, { ...NO_FILTERS, stockOnly: true }));
  assert.ok(!inStock.includes("3202"));
  assert.ok(inStock.includes("205"), "untracked stock (stock_type \"infinite\") is always on sale");
  const sirdaryo = names(filterProducts(catalog, { ...NO_FILTERS, categoryId: 48 }));
  assert.ok(sirdaryo.includes("001") && sirdaryo.includes("92050"));
  assert.equal(sizeFromParam(sizeParam("24.5×6.5")), "24.5×6.5");
});

test("facets: sizes smallest tile first, surfaces most common first", () => {
  assert.deepEqual(
    sizeFacets(catalog).map((s) => s.label),
    ["24.5×6.5", "30×60", "30×80", "60×60", "120×35", "60×120"],
  );
  assert.equal(finishFacets(catalog)[0].id, "polirovka");
});

test("similar tiles: same size and surface first, then same size", () => {
  const similar = names(similarProducts(byName("92050"), catalog));
  assert.deepEqual(similar.slice(0, 3).sort(), ["90022", "92056", "BT02"]);
  assert.equal(similar[3], "001", "then the other 60×60");
});

test("the product page's facts", () => {
  const p = byName("001");
  const rows = productSpecs(p, productOptions(p)[0], "Sirdaryo kafel", "60×60 glans");
  assert.deepEqual(rows.slice(0, 8), [
    { label: "Bo‘lim", value: "Sirdaryo kafel › 60×60 glans" },
    { label: "O‘lcham", value: "60×60 sm" },
    { label: "Sirti", value: "Glans" },
    { label: "Bir dona maydoni", value: "0.36 m²" },
    { label: "Bir qutida, dona", value: "4 dona" },
    { label: "Bir qutida, m²", value: "1.44 m²" },
    { label: "Bir quti og‘irligi", value: "28 kg" },
    { label: "1 m² og‘irligi", value: "≈ 19.44 kg" },
  ]);
});

test("the header's links: makers, then sizes", () => {
  const links = shopLinks(buildCategories(catalog), catalog);
  const kinds = links.map((l) => l.kind);
  assert.equal(kinds.lastIndexOf("category") < kinds.indexOf("size"), true);
  assert.equal(links.find((l) => l.label === "60×60")?.href, "/catalog?size=60x60");
});
