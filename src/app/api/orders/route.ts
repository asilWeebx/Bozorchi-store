import { NextResponse } from "next/server";

import { stockProblems } from "@/lib/cart/lines";
import { createOrder, getCatalog, StorefrontError } from "@/lib/storefront/client";
import { errorResponse } from "@/lib/storefront/route-helpers";
import type { OrderPayload } from "@/lib/storefront/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;

    if (!payload.customer_name?.trim() || !payload.phone?.trim()) {
      return NextResponse.json(
        { error: "Ism va telefon raqami majburiy" },
        { status: 400 },
      );
    }
    if (!payload.items?.length) {
      return NextResponse.json({ error: "Savat bo'sh" }, { status: 400 });
    }
    if (!["courier", "pickup"].includes(payload.delivery_type) || !["cash", "card"].includes(payload.payment_method)) {
      return NextResponse.json({ error: "Yetkazish yoki to'lov usuli noto'g'ri" }, { status: 400 });
    }
    if (payload.items.some((item) => !(Number(item.qty) > 0))) {
      return NextResponse.json({ error: "Miqdor noto'g'ri" }, { status: 400 });
    }
    if (payload.note != null && (typeof payload.note !== "string" || payload.note.length > 500)) {
      return NextResponse.json({ error: "Izoh 500 belgidan oshmasin" }, { status: 400 });
    }

    // Over-stock lines are refused here: for a product without variants the
    // ERP has crashed on them (a bare 500) instead of saying what is wrong. If
    // the catalog cannot be read, the ERP's own check still applies.
    const catalog = await getCatalog().catch(() => null);
    const problems = catalog ? stockProblems(payload.items, catalog.results) : [];
    if (problems.length) {
      return NextResponse.json({ error: problems.join("\n") }, { status: 409 });
    }

    return NextResponse.json(await createOrder(payload));
  } catch (error) {
    if (error instanceof StorefrontError && error.status >= 500) {
      console.error("Order failed in the ERP", error);
      return NextResponse.json(
        { error: "Buyurtmani qabul qilishda xatolik. Birozdan so'ng qayta urinib ko'ring yoki do'konga qo'ng'iroq qiling." },
        { status: 502 },
      );
    }
    return errorResponse(error);
  }
}
