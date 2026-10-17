"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Overlay = "cart" | "catalog" | "search" | null;
interface ShopUiValue {
  overlay: Overlay;
  open: (overlay: Exclude<Overlay, null>) => void;
  close: () => void;
  back: (fallback?: string) => void;
}
const Context = createContext<ShopUiValue | null>(null);

export function ShopUiProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const visits = useRef(0);
  const previousPath = useRef<string | null>(null);
  useEffect(() => { if (previousPath.current !== pathname) { visits.current += 1; previousPath.current = pathname; } }, [pathname]);
  const close = useCallback(() => setOverlay(null), []);
  const back = (fallback = "/catalog") => {
    close();
    if (visits.current > 1) router.back();
    else router.push(fallback);
  };
  return <Context.Provider value={{ overlay, open: setOverlay, close, back }}>{children}</Context.Provider>;
}

export function useShopUi() {
  const value = useContext(Context);
  if (!value) throw new Error("ShopUiProvider is required");
  return value;
}
