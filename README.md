# Bozor ERP — Online do'kon (headless)

Bu **alohida** online do'kon. ERP frontendiga bog'lanmagan — u faqat ERP
**Storefront API**ga API kalit orqali ulanadi (subdomen yo'q).

## Sozlash
`config.js` faylini oching va ikkita qiymatni kiriting:

```js
window.STORE_CONFIG = {
  API_URL: 'http://localhost:8000/api',
  STOREFRONT_KEY: 'sk_live_telefonnomer_31dukon',   // ERP paneldan olinadi
}
```

- **API_URL** — ERP backend manzili
- **STOREFRONT_KEY** — tashkilot + filial kaliti (SuperAdmin → tashkilot → Online Store)

Kalit qaysi tashkilotning qaysi filiali ekanini ERP o'zi biladi.

## Ishga tushirish
Statik fayl — build kerak emas. Papkada:

```bash
python3 -m http.server 5500
```

Keyin brauzerда: **http://localhost:5500**

> `file://` orqali ochilmaydi (CORS). `http.server` (5500 yoki 8080-port)
> orqali oching — bu portlar ERP CORS ro'yxatiga qo'shilgan.

## Qanday ishlaydi
```
Online do'kon  ──X-Storefront-Key──►  ERP /api/storefront/products/   (o'qish)
                                       ERP /api/storefront/orders/     (buyurtma)
```
Buyurtma ERP'da **Zakazlar** sahifasiga tushadi → tasdiqlanib sotilganda o'sha
filialda **Sale** bo'ladi va qoldiq kamayadi.

## Fayllar
- `index.html` — React ilova (katalog, birlik tanlash, savat, checkout)
- `config.js` — API manzili + kalit
