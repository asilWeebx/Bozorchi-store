"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SafeImage } from "@/components/ui/SafeImage";
import { useReducedMotion } from "@/lib/motion";

import styles from "./HeroCarousel.module.css";

export interface HeroSlide {
  image: string;
  /** For slides without a headline: what the picture says. */
  alt?: string;
  /** Slides from the ERP carry their own text in the picture, so they have none here. */
  eyebrow?: string;
  title?: string;
  text?: string;
  href?: string;
  /** Which side of the photo is quiet enough for the text. */
  align?: "left" | "right";
  /** On phones, which part of the photo to keep (`object-position`). */
  focus?: string;
}

/**
 * The home page's slides: banners uploaded in the ERP, or, while there are
 * none, the shop's own photos with a headline. Swipeable, with arrows and
 * dots; turns every 6 s unless the visitor has touched it, is hovering, or
 * prefers reduced motion.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const viewport = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const go = (next: number) => {
    const el = viewport.current;
    if (el) el.scrollTo({ left: ((next + slides.length) % slides.length) * el.clientWidth, behavior: reduce ? "instant" : "smooth" });
  };

  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const timer = setInterval(() => {
      const el = viewport.current;
      if (!el || document.hidden) return;
      el.scrollTo({ left: ((Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length) * el.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, reduce, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      className={styles.carousel}
      aria-label="Aksiyalar va yangiliklar"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
    >
      <ul
        ref={viewport}
        className={styles.track}
        onPointerDown={() => setPaused(true)}
        onScroll={() => {
          const el = viewport.current;
          if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {slides.map((slide, i) => (
          <li
            key={`${slide.image}-${i}`}
            className={`${styles.slide} ${slide.title ? styles.withCopy : ""} ${slide.align === "right" ? styles.right : ""}`}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            style={slide.focus ? ({ "--focus": slide.focus } as React.CSSProperties) : undefined}
          >
            <div className={styles.picture}>
              <SafeImage src={slide.image} alt={slide.title ? "" : slide.alt || "Aksiya"} sizes="(min-width: 1280px) 1216px, 100vw" eager={i === 0} className={styles.image} />
            </div>
            {slide.title && (
              <div className={styles.copy}>
                {slide.eyebrow && <p className={styles.eyebrow}>{slide.eyebrow}</p>}
                {i === 0 ? <h1 className={styles.title}>{slide.title}</h1> : <h2 className={styles.title}>{slide.title}</h2>}
                {slide.text && <p className={styles.text}>{slide.text}</p>}
                {slide.href && (
                  <Link href={slide.href} className={styles.cta} tabIndex={i === index ? undefined : -1}>
                    Katalogni ko‘rish
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {slides.length > 1 && (
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} aria-label="Oldingi" onClick={() => go(index - 1)}>
            <ChevronLeft size={18} aria-hidden />
          </button>
          {slides.map((_, i) => (
            <button key={i} type="button" className={styles.dot} aria-label={`Slayd ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => go(i)} />
          ))}
          <button type="button" className={styles.arrow} aria-label="Keyingi" onClick={() => go(index + 1)}>
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
