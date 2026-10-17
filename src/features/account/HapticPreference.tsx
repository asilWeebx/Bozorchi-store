"use client";

import { useSyncExternalStore } from "react";

import { HAPTICS_EVENT, HAPTICS_KEY } from "@/lib/cart/feedback";

import styles from "./HapticPreference.module.css";

const subscribe = (callback: () => void) => {
  window.addEventListener(HAPTICS_EVENT, callback);
  return () => window.removeEventListener(HAPTICS_EVENT, callback);
};
const snapshot = () => {
  try {
    return localStorage.getItem(HAPTICS_KEY) === "1";
  } catch {
    return false;
  }
};

/** Opt-in vibration when something goes into the cart (phones that support it). */
export function HapticPreference() {
  const enabled = useSyncExternalStore(subscribe, snapshot, () => false);
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          try {
            localStorage.setItem(HAPTICS_KEY, event.target.checked ? "1" : "0");
            window.dispatchEvent(new Event(HAPTICS_EVENT));
          } catch {
            // Storage may be disabled.
          }
        }}
      />
      Savatga qo‘shishda telefon tebransin
    </label>
  );
}
