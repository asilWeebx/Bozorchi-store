"use client";

import { ZoomIn } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { SafeImage, isRenderableImageUrl } from "@/components/ui/SafeImage";

import styles from "./Gallery.module.css";

/**
 * The main photo, with thumbnails under it when there is more than one, and
 * a zoomable full view. `art` stands in when there is no photo.
 */
export function Gallery({
  images,
  active,
  onSelect,
  alt,
  art,
}: {
  images: string[];
  active: string;
  onSelect: (image: string) => void;
  alt: string;
  art: ReactNode;
}) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const canZoom = isRenderableImageUrl(active) && failed !== active;
  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <SafeImage
          src={active}
          alt={alt}
          className={styles.photo}
          sizes="(min-width: 960px) 640px, 100vw"
          eager
          onFail={() => setFailed(active)}
          fallback={art}
        />
        {canZoom && (
          <button type="button" className={styles.zoom} aria-label="Rasmni kattalashtirish" onClick={() => setZoom(active)}>
            <ZoomIn size={18} aria-hidden />
            <span>Kattalashtirish</span>
          </button>
        )}
      </div>
      {images.length > 1 && (
        <ul className={styles.thumbs}>
          {images.map((image, i) => (
            <li key={image}>
              <button type="button" className={styles.thumb} aria-label={`Rasm ${i + 1}`} aria-current={image === active ? "true" : undefined} onClick={() => onSelect(image)}>
                <SafeImage src={image} alt="" sizes="80px" className={styles.photo} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {zoom && <ImageLightbox src={zoom} alt={alt} onClose={() => setZoom(null)} />}
    </div>
  );
}
