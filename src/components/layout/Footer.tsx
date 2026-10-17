import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { BRAND, STORE_CONTACT, telHref } from "@/config/store";
import type { ShopLink } from "@/lib/storefront/nav";

import { Logo } from "./BrandMark";
import styles from "./Footer.module.css";

export function Footer({ organization, links }: { organization: string; links: ShopLink[] }) {
  const { phones, address, landmark, hours, deliveryArea, telegram, instagram } = STORE_CONTACT;
  const hasContact = phones.length > 0 || address || hours || telegram || instagram;

  return (
    <footer className={styles.footer}>
      <Container className={styles.grid}>
        <div className={styles.about}>
          <p className={styles.name}>
            <Logo height={64} />
          </p>
          <p className={styles.slogan}>{BRAND.tagline}</p>
          <p className={styles.text}>
            Kafel va keramogranit: bo‘lim, o‘lcham va sirt bo‘yicha tanlang. Narx va qoldiq do‘kon tizimidan to‘g‘ridan-to‘g‘ri
            olinadi.
          </p>
          {hasContact && (
            <ul className={styles.contact}>
              {phones.map((phone) => (
                <li key={phone}>
                  <a href={telHref(phone)} className={styles.phone}>
                    {phone}
                  </a>
                </li>
              ))}
              {address && (
                <li>
                  {address}
                  {landmark && <span className={styles.muted}> · {landmark}</span>}
                </li>
              )}
              {hours && <li className={styles.muted}>{hours}</li>}
              {(telegram || instagram) && (
                <li className={styles.social}>
                  {telegram && (
                    <a href={telegram} target="_blank" rel="noreferrer">
                      Telegram
                    </a>
                  )}
                  {instagram && (
                    <a href={instagram} target="_blank" rel="noreferrer">
                      Instagram
                    </a>
                  )}
                </li>
              )}
            </ul>
          )}
        </div>

        {links.length > 0 && (
          <div>
            <p className={styles.heading}>Katalog</p>
            <ul className={styles.links}>
              {(links.some((l) => l.kind === "category") ? links.filter((l) => l.kind === "category") : links).slice(0, 8).map((link) => (
                <li key={link.key}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/catalog" className={styles.more}>
                  Barcha mahsulotlar →
                </Link>
              </li>
            </ul>
          </div>
        )}

        <div>
          <p className={styles.heading}>Xaridorlar uchun</p>
          <ul className={styles.links}>
            <li>
              <Link href="/catalog">Katalog</Link>
            </li>
            <li>
              <Link href="/cart">Savat</Link>
            </li>
            <li>
              <Link href="/account">Mijoz kabineti</Link>
            </li>
            <li>
              <Link href="/privacy">Maxfiylik siyosati</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className={styles.heading}>Yetkazib berish</p>
          <ul className={styles.terms}>
            <li>Kuryer orqali yetkazib beramiz yoki do‘kondan o‘zingiz olib ketasiz. Narxi va vaqtini do‘kon buyurtmadan so‘ng aytadi.</li>
            {deliveryArea && <li>Hudud: {deliveryArea}</li>}
            <li>To‘lov naqd yoki karta orqali, buyurtmani qabul qilganda. Buyurtmadan so‘ng do‘kon siz bilan bog‘lanadi.</li>
          </ul>
        </div>
      </Container>
      <Container className={styles.bottom}>
        <span>
          © {new Date().getFullYear()} {organization || BRAND.name}
        </span>
        <Link href="/privacy">Maxfiylik siyosati</Link>
      </Container>
    </footer>
  );
}
