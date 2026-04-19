"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  priceDokumentasi,
  priceJeep,
  priceTransport,
  priceVilla,
} from "@/lib/pricing";

type CartItemBase = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  image?: string;
  categoryLabel?: string;
};

export type CartItem =
  | (CartItemBase & {
      kind: "villa";
      pricePerNight: number;
      start: string;
      end: string;
      pax: number;
      baseCapacity: number;
    })
  | (CartItemBase & {
      kind: "jeep";
      pricePerHour: number;
      date: string;
      time: string;
      hours: number;
    })
  | (CartItemBase & {
      kind: "transport";
      pricePerRoute: number;
      date: string;
      time?: string;
      route?: string;
    })
  | (CartItemBase & {
      kind: "dokumentasi";
      pricePerHour: number;
      date: string;
      time: string;
      hours: number;
      packagePrice?: number;
    });

export type CartInput =
  | (Omit<Extract<CartItem, { kind: "villa" }>, "id" | "quantity"> & { quantity?: number })
  | (Omit<Extract<CartItem, { kind: "jeep" }>, "id" | "quantity"> & { quantity?: number })
  | (Omit<Extract<CartItem, { kind: "transport" }>, "id" | "quantity"> & { quantity?: number })
  | (Omit<Extract<CartItem, { kind: "dokumentasi" }>, "id" | "quantity"> & { quantity?: number });

export type CartTotals = {
  lineCount: number;
  totalQuantity: number;
  subtotal: number;
  fees: number;
  total: number;
};

type Ctx = {
  items: CartItem[];
  add: (item: CartInput) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
};

/* =========================
   Storage helpers (safe)
========================= */
const STORAGE_KEY = "cart:v1";
const LEGACY_STORAGE_KEY = "cart_v1";
const isBrowser = typeof window !== "undefined";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

function normalizeQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }
  return 1;
}

function normalizeBase(raw: Record<string, unknown>) {
  const id = stringOrUndefined(raw.id);
  const productId = stringOrUndefined(raw.productId);
  const name = stringOrUndefined(raw.name);
  if (!id || !productId || !name) return null;

  return {
    id,
    productId,
    name,
    quantity: normalizeQuantity(raw.quantity),
    image: stringOrUndefined(raw.image),
    categoryLabel: stringOrUndefined(raw.categoryLabel),
  };
}

function normalizeStoredItem(raw: unknown): CartItem | null {
  if (!isRecord(raw)) return null;
  const kind = stringOrUndefined(raw.kind);
  const base = normalizeBase(raw);
  if (!kind || !base) return null;

  if (kind === "villa") {
    const pricePerNight = numberOrNull(raw.pricePerNight);
    const start = stringOrUndefined(raw.start);
    const end = stringOrUndefined(raw.end);
    const pax = numberOrNull(raw.pax);
    const baseCapacity = numberOrNull(raw.baseCapacity);
    if (pricePerNight === null || !start || !end || pax === null || baseCapacity === null) {
      return null;
    }
    return {
      ...base,
      kind: "villa",
      pricePerNight,
      start,
      end,
      pax,
      baseCapacity,
    };
  }

  if (kind === "jeep") {
    const pricePerHour = numberOrNull(raw.pricePerHour);
    const date = stringOrUndefined(raw.date);
    const time = stringOrEmpty(raw.time);
    const hours = numberOrNull(raw.hours);
    if (pricePerHour === null || !date || hours === null) return null;
    return {
      ...base,
      kind: "jeep",
      pricePerHour,
      date,
      time,
      hours,
    };
  }

  if (kind === "transport") {
    const pricePerRoute = numberOrNull(raw.pricePerRoute);
    const date = stringOrUndefined(raw.date);
    if (pricePerRoute === null || !date) return null;
    return {
      ...base,
      kind: "transport",
      pricePerRoute,
      date,
      time: stringOrUndefined(raw.time),
      route: stringOrUndefined(raw.route),
    };
  }

  if (kind === "dokumentasi") {
    const pricePerHour = numberOrNull(raw.pricePerHour);
    const date = stringOrUndefined(raw.date);
    const time = stringOrEmpty(raw.time);
    const hours = numberOrNull(raw.hours);
    if (pricePerHour === null || !date || hours === null) return null;
    return {
      ...base,
      kind: "dokumentasi",
      pricePerHour,
      date,
      time,
      hours,
      packagePrice: numberOrNull(raw.packagePrice) ?? undefined,
    };
  }

  return null;
}

function normalizeLegacyItem(raw: unknown): CartItem | null {
  if (!isRecord(raw)) return null;
  const kind = stringOrUndefined(raw.kind);
  const productId = stringOrUndefined(raw.productId);
  const name = stringOrUndefined(raw.name);
  if (!kind || !productId || !name) return null;

  if (kind === "villa") {
    const unitPrice = numberOrNull(raw.unitPrice);
    const start = stringOrUndefined(raw.start);
    const end = stringOrUndefined(raw.end);
    const baseCapacity = numberOrNull(raw.baseCapacity);
    const extraPerson = numberOrNull(raw.extraPerson) ?? 0;
    if (unitPrice === null || !start || !end || baseCapacity === null) return null;
    return {
      id: uuid(),
      kind: "villa",
      productId,
      name,
      quantity: 1,
      pricePerNight: unitPrice,
      start,
      end,
      pax: baseCapacity + extraPerson,
      baseCapacity,
    };
  }

  if (kind === "jeep") {
    const unitPrice = numberOrNull(raw.unitPrice);
    const date = stringOrUndefined(raw.date);
    const time = stringOrEmpty(raw.time);
    const hours = numberOrNull(raw.hours);
    if (unitPrice === null || !date || hours === null) return null;
    return {
      id: uuid(),
      kind: "jeep",
      productId,
      name,
      quantity: 1,
      pricePerHour: unitPrice,
      date,
      time,
      hours,
    };
  }

  if (kind === "transport") {
    const unitPrice = numberOrNull(raw.unitPrice);
    const date = stringOrUndefined(raw.date);
    if (unitPrice === null || !date) return null;
    return {
      id: uuid(),
      kind: "transport",
      productId,
      name,
      quantity: 1,
      pricePerRoute: unitPrice,
      date,
      time: stringOrUndefined(raw.time),
      route: stringOrUndefined(raw.route),
    };
  }

  if (kind === "dokumentasi") {
    const unitPrice = numberOrNull(raw.unitPrice);
    const date = stringOrUndefined(raw.date);
    const time = stringOrEmpty(raw.time);
    const hours = numberOrNull(raw.hours);
    if (unitPrice === null || !date || hours === null) return null;
    return {
      id: uuid(),
      kind: "dokumentasi",
      productId,
      name,
      quantity: 1,
      pricePerHour: unitPrice,
      date,
      time,
      hours,
    };
  }

  return null;
}

function safeReadCurrent(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.trim() === "") return [];           // kosong → []
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredItem).filter((item): item is CartItem => item !== null);
  } catch {
    // JSON rusak → anggap kosong, jangan bikin app meledak
    return [];
  }
}

function safeReadLegacy(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw || raw.trim() === "") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLegacyItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function safeWrite(items: CartItem[]) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota full / private mode — abaikan
  }
}

function clearLegacyStorage() {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors.
  }
}

function uuid(): string {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // Fall through to manual id.
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/* =========================
   Dedupe key (supaya item identik tidak dobel)
========================= */
function dedupeKey(i: CartInput | CartItem): string {
  switch (i.kind) {
    case "villa":
      return `${i.kind}:${i.productId}:${i.start}:${i.end}:${i.pax}`;
    case "jeep":
      return `${i.kind}:${i.productId}:${i.date}:${i.time}:${i.hours}`;
    case "transport":
      return `${i.kind}:${i.productId}:${i.date}:${i.time ?? "-"}:${i.route ?? "-"}`;
    case "dokumentasi":
      return `${i.kind}:${i.productId}:${i.date}:${i.time}:${i.hours}:${i.packagePrice ?? 0}`;
  }
}

function mergeCollections(...collections: CartItem[][]): CartItem[] {
  const merged = new Map<string, CartItem>();

  for (const collection of collections) {
    for (const item of collection) {
      const key = dedupeKey(item);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, item);
        continue;
      }

      merged.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        image: existing.image ?? item.image,
        categoryLabel: existing.categoryLabel ?? item.categoryLabel,
      });
    }
  }

  return [...merged.values()];
}

export function getCartItemUnitPrice(item: CartItem): number {
  switch (item.kind) {
    case "villa":
      return item.pricePerNight;
    case "jeep":
    case "dokumentasi":
      return item.pricePerHour;
    case "transport":
      return item.pricePerRoute;
  }
}

export function getCartItemUnitLabel(item: CartItem): "malam" | "jam" | "rute" {
  switch (item.kind) {
    case "villa":
      return "malam";
    case "jeep":
    case "dokumentasi":
      return "jam";
    case "transport":
      return "rute";
  }
}

export function getCartItemSelectionSubtotal(item: CartItem): number {
  switch (item.kind) {
    case "villa":
      return priceVilla({
        pricePerNight: item.pricePerNight,
        start: item.start,
        end: item.end,
        pax: item.pax,
        baseCapacity: item.baseCapacity,
      }).subtotal;
    case "jeep":
      return priceJeep({
        pricePerHour: item.pricePerHour,
        hours: item.hours,
      }).subtotal;
    case "transport":
      return priceTransport({
        pricePerRoute: item.pricePerRoute,
      }).subtotal;
    case "dokumentasi":
      return priceDokumentasi({
        pricePerHour: item.pricePerHour,
        hours: item.hours,
        packagePrice: item.packagePrice,
      }).subtotal;
  }
}

export function getCartItemSubtotal(item: CartItem): number {
  return getCartItemSelectionSubtotal(item) * item.quantity;
}

export function getCartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + getCartItemSubtotal(item), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const fees = 0;

  return {
    lineCount: items.length,
    totalQuantity,
    subtotal,
    fees,
    total: subtotal + fees,
  };
}

/* =========================
   Context
========================= */
const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    const currentItems = safeReadCurrent();
    const legacyItems = safeReadLegacy();
    const hydrated = mergeCollections(currentItems, legacyItems);

    setItems(hydrated);
    mounted.current = true;

    if (legacyItems.length > 0) {
      safeWrite(hydrated);
      clearLegacyStorage();
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) return;
    safeWrite(items);
  }, [items]);

  useEffect(() => {
    if (!isBrowser) return undefined;

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setItems(safeReadCurrent());
    };

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const api: Ctx = useMemo(
    () => ({
      items,
      add: (input) => {
        const nextQuantity = normalizeQuantity(input.quantity);

        setItems((prev) => {
          const key = dedupeKey(input);
          const idx = prev.findIndex((item) => dedupeKey(item) === key);

          if (idx >= 0) {
            const currentItem = prev[idx];
            const mergedItem: CartItem = {
              ...currentItem,
              quantity: currentItem.quantity + nextQuantity,
              image: currentItem.image ?? input.image,
              categoryLabel: currentItem.categoryLabel ?? input.categoryLabel,
            };

            return [...prev.slice(0, idx), mergedItem, ...prev.slice(idx + 1)];
          }

          const item: CartItem = {
            ...(input as CartItem),
            id: uuid(),
            quantity: nextQuantity,
          };
          return [...prev, item];
        });
      },
      remove: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
      updateQuantity: (id, quantity) => {
        const safeQuantity = Math.max(1, Math.floor(quantity || 1));
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item))
        );
      },
      increment: (id) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      },
      decrement: (id) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, item.quantity - 1) }
              : item
          )
        );
      },
      clear: () => setItems([]),
    }),
    [items]
  );

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
