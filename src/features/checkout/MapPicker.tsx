"use client";

import type { Map as LeafletMap } from "leaflet";
import { Crosshair, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { MAP_CENTER } from "@/config/store";
import { useDialogA11y } from "@/lib/dialog";

import styles from "./MapPicker.module.css";

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Where the map opens when there is nothing better to show (see `config/store.ts`). */
const DEFAULT_CENTER: Coordinates = MAP_CENTER;

/**
 * Coordinates to a street address (OpenStreetMap Nominatim), proxied through
 * `/api/reverse-geocode` so it can send the User-Agent Nominatim asks for.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(`/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { address?: string | null };
    return data.address ?? null;
  } catch {
    return null;
  }
}

/**
 * Full-screen map with a fixed centre pin: the customer drags the map under
 * it. The last centre is remembered between openings.
 */
export function MapPicker({
  open,
  initial,
  onPick,
  onClose,
}: {
  open: boolean;
  initial: Coordinates | null;
  onPick: (lat: number, lng: number, address: string | null) => void;
  onClose: () => void;
}) {
  const centerRef = useRef<Coordinates>(initial ?? DEFAULT_CENTER);
  if (!open) return null;
  return <MapDialog centerRef={centerRef} onPick={onPick} onClose={onClose} />;
}

/** Mounted per opening, so the address and error state start fresh. */
function MapDialog({
  centerRef,
  onPick,
  onClose,
}: {
  centerRef: React.RefObject<Coordinates>;
  onPick: (lat: number, lng: number, address: string | null) => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const dialogRef = useDialogA11y(true, onClose);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;
    let moveTimer: ReturnType<typeof setTimeout> | undefined;
    let initTimer: ReturnType<typeof setTimeout> | undefined;

    // Leaflet touches `window`, so it is only loaded once the map opens.
    import("leaflet")
      .then(({ default: L }) => {
        if (disposed || !boxRef.current) return;
        const c = centerRef.current;
        map = L.map(boxRef.current, { attributionControl: false, zoomControl: false }).setView([c.lat, c.lng], 16);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        L.control.zoom({ position: "topright" }).addTo(map);
        mapRef.current = map;

        const resolve = async () => {
          if (!map) return;
          const p = map.getCenter();
          centerRef.current = { lat: p.lat, lng: p.lng };
          setLoading(true);
          const found = await reverseGeocode(p.lat, p.lng);
          if (!disposed) {
            setAddress(found);
            setLoading(false);
          }
        };
        map.on("moveend", () => {
          clearTimeout(moveTimer);
          moveTimer = setTimeout(resolve, 350);
        });
        initTimer = setTimeout(() => {
          map?.invalidateSize();
          void resolve();
        }, 120);
      })
      .catch(() => {
        if (!disposed) {
          setMapError("Xarita yuklanmadi");
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      clearTimeout(moveTimer);
      clearTimeout(initTimer);
      map?.remove();
      mapRef.current = null;
    };
  }, [centerRef]);

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => mapRef.current?.setView([p.coords.latitude, p.coords.longitude], 17),
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="map-title" tabIndex={-1}>
      <h2 id="map-title" className="sr-only">
        Yetkazish joyini xaritadan tanlash
      </h2>
      <div ref={boxRef} className={styles.map} />
      {mapError && (
        <div className={styles.error} role="alert">
          {mapError}. Internet aloqasini tekshirib, qayta oching.
        </div>
      )}
      <div className={styles.pin} aria-hidden>
        <MapPin size={40} fill="currentColor" stroke="#fff" strokeWidth={1.5} />
      </div>
      <button type="button" className={`${styles.round} ${styles.close}`} aria-label="Xaritani yopish" onClick={onClose}>
        <X size={18} aria-hidden />
      </button>
      <button type="button" className={`${styles.round} ${styles.locate}`} aria-label="Joylashuvimni ko‘rsatish" onClick={locate}>
        <Crosshair size={20} aria-hidden />
      </button>
      <div className={styles.panel}>
        <p className={styles.label}>Tanlangan joy</p>
        <p className={styles.address}>
          {loading ? "Aniqlanmoqda..." : address || "Manzil aniqlanmadi (koordinata saqlanadi)"}
        </p>
        <Button
          size="lg"
          block
          disabled={Boolean(mapError)}
          onClick={() => onPick(centerRef.current.lat, centerRef.current.lng, address)}
        >
          Shu yerni tanlash
        </Button>
      </div>
    </div>
  );
}
