"use client";

import * as React from "react";
import { daysBetween } from "@/lib/availability";

/* ====== Types ====== */
export type CartItem =
  | {
      kind: "villa";
      productId: string;
      name: string;
      start: string;
      end: string;
      baseGuests: number;       // kapasitas dasar (termasuk harga kamar)
      extraGuests: number;      // tambahan tamu (akan dikalikan fee per malam)
      pricePerNight: number;
    }
  | {
      kind: "jeep";
      productId: string;
      name: string;
      date: string;
      time: string;
      hours: number;
      pricePerHour: number;
    }
  | {
      kind: "transport";
      productId: string;
      name: string;
      date: string;
      pricePerRoute: number;
    }
  | {
      kind: "dokumentasi";
      productId: string;
      name: string;
      date: string;
      time: string;
      hours: number;
      pricePerHour: number;
    };

export type CartCtx = {
  items: CartItem[];
  add: (it: CartItem) => void;
  remove: (idx: number) => void;
  clear: () => void;
  total: number; // subtotal semua item
};

/* ====== Constants ====== */
const LS_KEY = "gg-cart-v1";
const EXTRA_PERSON_FEE = 200_000; // fee per orang per malam untuk extra guest

/* ====== Utils ====== */
function itemSubtotal(it: CartItem): number {
  switch (it.kind) {
    case "villa": {
      const nights = Math.max(1, daysBetween(it.start, it.end));
      const room = it.pricePerNight * nights;
      const extra = Math.max(0, it.extraGuests) * EXTRA_PERSON_FEE * nights;
      return room + extra;
    }
    case "jeep": {
      const h = Math.max(1, it.hours);
      return it.pricePerHour * h;
    }
    case "dokumentasi": {
      const h = Math.max(1, it.hours);
      return it.pricePerHour * h;
    }
    case "transport":
      return it.pricePerRoute;
  }
}

function loadInitial(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Biarkan data apa adanya; validasi ringan:
    return parsed.filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

/* ====== Context ====== */
const CartContext = React.createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>(() => loadInitial());

  // persist ke localStorage
  React.useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items]);

  // sync antar-tab
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue != null) {
        try {
          const next = JSON.parse(e.newValue) as CartItem[];
          setItems(Array.isArray(next) ? next : []);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = React.useCallback((it: CartItem) => {
    setItems((prev) => [...prev, it]);
  }, []);

  const remove = React.useCallback((idx: number) => {
    setItems((prev) => (idx >= 0 && idx < prev.length ? prev.toSpliced(idx, 1) : prev));
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const total = React.useMemo(
    () => items.reduce((sum, it) => sum + itemSubtotal(it), 0),
    [items]
  );

  const value: CartCtx = React.useMemo(
    () => ({ items, add, remove, clear, total }),
    [items, add, remove, clear, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartCtx {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

/* ====== Optional helpers (boleh dipakai di UI) ====== */
export function calcItemSubtotal(it: CartItem): number {
  return itemSubtotal(it);
}
