"use client";

import { Banknote, Check, CreditCard, Crosshair, MapPin, ShoppingCart, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { STORE_CONTACT } from "@/config/store";
import { lineCurTotal, lineTotal, packText, toOrderItems } from "@/lib/cart/lines";
import { summarizeCart } from "@/lib/cart/totals";
import { useCart } from "@/lib/cart/useCart";
import { useCustomer } from "@/lib/customer/useCustomer";
import { fmtNumber, priceText, som } from "@/lib/storefront/currency";
import type { CustomerAccountResponse, DeliveryType, OrderPayload } from "@/lib/storefront/types";

import styles from "./CheckoutForm.module.css";
import { MapPicker, reverseGeocode } from "./MapPicker";
import { OrderSuccess } from "./OrderSuccess";

/** Nothing is charged online: cash or card when the order is handed over, as on the previous site. */
const PAYMENTS = [
  { value: "cash", title: "Naqd pul", text: "Kuryerga qo‘lma-qo‘l topshirasiz", Icon: Banknote },
  { value: "card", title: "Karta orqali", text: "Operator karta raqamini yuboradi", Icon: CreditCard },
];

export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const { customer } = useCustomer();

  // Null means untouched, so the signed-in customer's profile can prefill
  // the fields without overwriting anything typed.
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ code: string; name: string; phone: string } | null>(null);
  const [delivery, setDelivery] = useState<DeliveryType>("courier");
  const [payment, setPayment] = useState("cash");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ orderNo: string; summary: string } | null>(null);
  const courier = delivery === "courier";

  const code = customer?.customer_code;
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    fetch(`/api/customer?code=${encodeURIComponent(code)}`)
      .then((response) => (response.ok ? (response.json() as Promise<CustomerAccountResponse>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        const p = data.customer ?? {};
        setProfile({ code, name: p.name || p.customer_name || "", phone: p.phone || p.phone_number || "" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code]);

  const known = profile && profile.code === code ? profile : null;
  const nameValue = name ?? (known?.name || customer?.name || customer?.customer_name || "");
  const phoneValue = phone ?? (known?.phone || customer?.phone || customer?.phone_number || "");

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Qurilma joylashuvni aniqlay olmaydi");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        const found = await reverseGeocode(p.coords.latitude, p.coords.longitude);
        if (found) setAddress(found);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Joylashuvga ruxsat berilmadi");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameValue.trim() || !phoneValue.trim()) {
      setError("Ism va telefon raqami majburiy");
      return;
    }
    if (courier && !address.trim() && !coords) {
      setError("Manzilni kiriting yoki xaritadan belgilang");
      return;
    }
    const comment = note.trim().slice(0, 500);
    setError("");
    setSubmitting(true);

    const payload: OrderPayload = {
      customer_name: nameValue.trim(),
      phone: phoneValue.trim(),
      delivery_type: delivery,
      payment_method: payment,
      ...(courier ? { address: address.trim(), landmark: landmark.trim() } : {}),
      ...(courier && coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      ...(code ? { customer_code: code } : {}),
      ...(comment ? { note: comment } : {}),
      items: toOrderItems(items),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      // Stock moved since the page loaded: a fresh catalog re-caps the cart.
      if (response.status === 409) router.refresh();
      if (!response.ok) throw new Error(data.error || "Xatolik yuz berdi");
      setPlaced({ orderNo: data.order_no, summary: summarizeCart(items).total });
      clear();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = summarizeCart(items);

  if (placed) return <OrderSuccess orderNo={placed.orderNo} summary={placed.summary} onClose={() => router.push("/")} />;
  if (!ready) return <div className={styles.skeleton} aria-busy="true" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart size={32} aria-hidden />}
        title="Savat bo‘sh"
        text="Buyurtma berish uchun avval mahsulotlarni savatga qo‘shing."
        action={<ButtonLink href="/catalog">Katalogga o‘tish</ButtonLink>}
      />
    );
  }

  return (
    <form className={styles.layout} onSubmit={submit} noValidate>
      <div className={styles.form}>
        <h1 className={styles.title}>Buyurtmani rasmiylashtirish</h1>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Qabul qiluvchi</h2>
          <label className={styles.field}>
            <span className={styles.label}>Ismingiz</span>
            <input
              className={styles.input}
              name="name"
              autoComplete="name"
              value={nameValue}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ism Familiya"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Telefon raqam</span>
            <input
              className={styles.input}
              type="tel"
              name="phone"
              autoComplete="tel"
              value={phoneValue}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+998 90 000 00 00"
            />
          </label>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Yetkazib berish</h2>
          <Segmented
            label="Yetkazib berish usuli"
            value={delivery}
            onChange={setDelivery}
            options={[
              { value: "courier", label: "Kuryer" },
              { value: "pickup", label: "Olib ketaman" },
            ]}
          />
          {courier && (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Manzil</span>
                <input
                  className={styles.input}
                  name="address"
                  autoComplete="street-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Ko‘cha, uy, xonadon"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Mo‘ljal (ixtiyoriy)</span>
                <input
                  className={styles.input}
                  name="landmark"
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                  placeholder="Masalan: maktab yonida, 3-podyezd"
                />
              </label>
              <div className={styles.locationButtons}>
                <Button variant="secondary" onClick={locateMe} disabled={locating} icon={<Crosshair size={16} aria-hidden />}>
                  {locating ? "Aniqlanmoqda..." : "Meni topish"}
                </Button>
                <Button variant="secondary" onClick={() => setMapOpen(true)} icon={<MapPin size={16} aria-hidden />}>
                  Xaritadan belgilash
                </Button>
              </div>
              {coords && (
                <p className={styles.located}>
                  <Check size={14} aria-hidden /> Joylashuv belgilandi
                </p>
              )}
            </>
          )}
          {!courier && (
            <p className={styles.pickup}>
              <Store size={18} aria-hidden />
              <span>
                {STORE_CONTACT.address ? (
                  <>
                    Olib ketish manzili: <strong>{STORE_CONTACT.address}</strong>
                    {STORE_CONTACT.landmark && ` (${STORE_CONTACT.landmark})`}
                    {STORE_CONTACT.hours && `. ${STORE_CONTACT.hours}`}
                  </>
                ) : (
                  "Buyurtma tayyor bo‘lganda do‘kon qo‘ng‘iroq qilib, olib ketish manzili va vaqtini aytadi."
                )}
              </span>
            </p>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>To‘lov usuli</h2>
          <div className={styles.payments} role="radiogroup" aria-label="To‘lov usuli">
            {PAYMENTS.map(({ value, title, text, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={payment === value}
                className={styles.payment}
                onClick={() => setPayment(value)}
              >
                <Icon size={22} aria-hidden />
                <span className={styles.paymentText}>
                  <span className={styles.paymentTitle}>{title}</span>
                  <span className={styles.paymentSub}>{text}</span>
                </span>
                <span className={styles.radio} aria-hidden />
              </button>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Izoh</h2>
          <label className={styles.field}>
            <span className={styles.label}>Do‘kon uchun izoh (ixtiyoriy)</span>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Masalan: qavat, lift bormi, qo‘ng‘iroq uchun qulay vaqt"
            />
          </label>
        </section>
      </div>

      <aside className={styles.summary}>
        <h2 className={styles.cardTitle}>Buyurtmangiz</h2>
        <ul className={styles.items}>
          {items.map((item) => {
            const pack = packText(item);
            return (
              <li key={item.key} className={styles.item}>
                <span className={styles.itemName}>
                  {item.name}
                  {(item.caption || item.option_label) && <span className={styles.itemOption}>{[item.caption, item.option_label].filter(Boolean).join(" · ")}</span>}
                  <span className={styles.itemAmount}>
                    {fmtNumber(item.qty)} {item.unit}
                    {pack && ` (${pack})`} × {priceText(item.cur_price, item.currency)}
                  </span>
                </span>
                <span className={styles.itemTotal}>{item.currency === "USD" ? priceText(lineCurTotal(item), "USD") : som(lineTotal(item))}</span>
              </li>
            );
          })}
        </ul>
        <div className={styles.total}>
          <span>
            Jami
            {(summary.weight || summary.inSom) && <small>{[summary.weight, summary.inSom].filter(Boolean).join(" · ")}</small>}
          </span>
          <strong>{summary.total}</strong>
        </div>
        <p className={styles.delivery}>Yetkazib berish narxi va vaqtini do‘kon buyurtmadan so‘ng telefonda aytadi.</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block disabled={submitting}>
          {submitting ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
        </Button>
      </aside>

      <MapPicker
        open={mapOpen}
        initial={coords}
        onPick={(lat, lng, found) => {
          setCoords({ lat, lng });
          if (found) setAddress(found);
          setMapOpen(false);
        }}
        onClose={() => setMapOpen(false)}
      />
    </form>
  );
}
