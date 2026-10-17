# Kafel Baraka

Online store for **Kafel Baraka** (kafelbaraka.uz), a tile and porcelain
stoneware shop. Built with Next.js 16 (App Router), React 19 and CSS Modules,
for a Cloudflare Worker (OpenNext). Products, prices, stock and customer
accounts come from the [dukonline.uz](https://dukonline.uz) ERP's Storefront
API (organization "Kafel baraka", store "KAFEL"). The only thing the site
writes back is an order.

It replaces the previous single-file site (`index.html` + `config.js`, React
from a CDN), which is in this repository's history. The site is in Uzbek
(Latin); the privacy policy is the shop's published English text.

## Getting started

```bash
npm ci
cp .env.example .env.local     # then paste the storefront key
npm run dev                    # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `DUKONLINE_API_URL` | `https://api.dukonline.uz/api`. Same host for every tenant. |
| `DUKONLINE_STOREFRONT_KEY` | Selects the tenant (`X-Storefront-Key`). ERP SuperAdmin → organization → Online Store. Server-side only. |
| `SITE_URL` | Optional. The public address for link previews, `sitemap.xml` and `robots.txt`. Defaults to `https://kafelbaraka.uz`. |

`.env*` files are git-ignored. Sign-in, account data, orders and reverse
geocoding go through route handlers in `src/app/api/`, so the key never
reaches the browser (the old site had it in `config.js`, in public).

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm start           # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # node --test over tests/*.test.ts
npm run cf:build    # OpenNext build for Cloudflare
npm run cf:preview  # build, then run the Worker locally
npm run cf:deploy   # build, then deploy the Worker
```

## Deploying (Cloudflare Workers)

Not deployed yet. The Worker is named `kafel-baraka` in `wrangler.jsonc`.

```bash
npx wrangler secret put DUKONLINE_STOREFRONT_KEY
SITE_URL=https://kafelbaraka.uz npm run cf:deploy
```

- `SITE_URL` is set in `wrangler.jsonc` and must be passed to the build too,
  because `robots.txt` is prerendered.
- The OpenNext build copies `.env.local` into the bundle, so keep only the
  variables above in it.
- For the shared catalog cache (see Speed), create a KV namespace for this
  shop and bind it as `STOREFRONT_CACHE` (commented out in `wrangler.jsonc`).
  Never reuse another shop's namespace: its keys carry no tenant. Without the
  binding the site works, with a per-instance memory cache only.
- Images are served as they are (`images.unoptimized`): the local images are
  pre-shrunk WebP files, the ERP's photos are WebP on its CDN.

## How tiles are sold

The ERP prices tiles per **m²** ("Metr kvadrat") and stair steps per piece
("Dona"). Tiles with `product_type: "kafel"` also carry their box:

```json
"attributes": { "razmer": "60X60", "pochka_m2": "1.44", "dona_per_pochka": "4", "pochka_weight_kg": "28" }
```

All of this lives in `src/lib/shop/tiles.ts` (size, surface, box) and
`src/lib/shop/options.ts` (what can be bought, in what steps):

- **Whole tiles.** Stock is counted in whole tiles (27.72 m² of 30×60 is
  exactly 154 tiles), so amounts are always a whole number of tiles: typed
  m² round up (10 m² of 60×60 → 28 tiles, 10.08 m²). The tile's area comes
  from the box (1.44 m² ÷ 4) when that agrees with the size, else from the
  size alone. A third of the catalog has no attributes; their size is read
  from the category name ("60X120 GLANS").
- **Boxes.** + and − move to the next whole box; the amount always shows as
  boxes and tiles ("10 quti + 3 dona") and its weight. A part box can be
  rounded up with one click. Partial boxes are allowed, as on the old site.
- **What the ERP is sent:** `qty` in m² (with decimals) or pieces, no
  `unit_id` (every product has only its base unit), `variant_id` for a model
  of a series. The same as the previous site.
- **Area helper.** On the product page, "Necha m² kerakligini hisoblash"
  turns length × width plus 0–15% spare into m² of whole tiles. Folded away
  by default.
- **Surfaces** (glans, mat, shakar, polirovka) come from category names.
  The top categories (Sirdaryo kafel, Qo‘qon kafel, Krea, Polsha, Eron,
  Tashkent, Xit) mix regions, brands and countries, so the site calls them
  "Bo‘lim", not "maker"; categories three levels deep (Sirdaryo kafel ›
  60x60 GLANS › 60X60 PALIROVKA) sit under their top category.
- **Series.** Products with variants ("MADEL: A", "MADEL: B") show them as
  "Model A, B, C" chips.
- **Dollars.** Some tiles are priced in dollars (`currency: "USD"`,
  `cur_price` 6.3, `price` 76 230 at the ERP's 12 100 rate). As on the old
  site they show in dollars, with the so'm amount beside them; the cart total
  is per currency ("$9.07 + 804 960 so'm") plus the so'm sum and the rate.
- **No photo** (94 of 158 products on 2026-10-17): the tile is drawn to its
  real proportions with its size (`TileArt`).

## Shop details

Phone numbers, pickup address, hours, delivery area and social links are not
in the API and not known yet. They go in `src/config/store.ts`; empty fields
are simply not shown. The privacy contact is the one in the published policy.
The checkout map opens on Tashkent (as before). Payment is cash or card on
delivery. The home page uses the shop's three banner photos and headlines
until banners are uploaded in the ERP.

## Speed

The dukonline ERP sometimes holds a request for a minute and then fails with
a 504. Reads are hedged (a second request after 2 s, a third after 5 s, give
up at 15 s), responses are kept in memory and refreshed in the background
(catalog 60 s, store info and best sellers 5 min), and the last good copy is
served if the ERP fails (`src/lib/storefront/client.ts`, `hedge.ts`,
`swr-cache.ts`, `shared-cache.ts`).

## Layout

```text
src/
├── app/                routes: home, catalog, product/[id], cart, checkout, account, privacy, api/, sitemap, robots
├── features/
│   ├── home/           HeroCarousel, Perks, ProductShelf, SizeStrip, PackGuide, HowToOrder
│   ├── catalog/        CategoryChips, FilterPanel (maker, size, surface, stock), FiltersDrawer, SortSelect, URL params
│   ├── product/        ProductDetail, Gallery, SpecTable
│   ├── cart/           CartView, CartLine
│   ├── checkout/       CheckoutForm, MapPicker, OrderSuccess
│   └── account/        AccountView, LoginForm, CustomerPortal
├── components/
│   ├── layout/         Header, CategoryNav, SearchBox, MobileNav, ShopOverlays, Footer, BrandMark, TileGlyph
│   ├── product/        ProductCard, ProductGrid, BuyBox (+ area helper), OptionPicker, QuickBuy, TileArt
│   └── ui/             Button, Container, Dialog, Stepper, Segmented, Price, SafeImage, ImageLightbox, EmptyState
├── config/store.ts     brand and shop details
├── lib/
│   ├── storefront/     API client, store (the one data seam), catalog logic, nav links, types, currency
│   ├── shop/           tiles (size, surface, box), buy options, specs
│   ├── cart/           pure reducers (lines.ts), quantities, totals, useCart, CartSync
│   └── customer/       session cookie, useCustomer
└── styles/             tokens.css (design tokens), reset.css
```

### Design

From the logo: its bronze K and frame, silver-white lettering and black and
white marble tiles on a warm near-black. Pages are warm marble white; the
header, footer and highlighted shelves are the logo's dark, so the logo is
used as drawn. Buttons use a deeper bronze (`#87673f`, white on it 5.1:1).
Headings are Marcellus (a Roman capital like "KAFEL"), text is Jost
(geometric like "BARAKA"); product codes and sizes are set in Jost, since
Marcellus draws 0 and 1 like O and I.
