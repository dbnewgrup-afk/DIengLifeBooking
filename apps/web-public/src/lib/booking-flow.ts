"use client";

import type { ProductType, ProductUnit } from "@/types";

export type BookingAddonKey = "jeep" | "breakfast";

export interface BookingAddonLine {
  key: BookingAddonKey;
  label: string;
  price: number;
  enabled: boolean;
}

export interface BookingDraft {
  orderCode: string;
  createdAt: string;
  category: ProductType;
  promoCode?: string;
  discountAmount?: number;
  product: {
    id: string;
    name: string;
    image: string;
    location: string;
    unit: ProductUnit | "malam";
    price: number;
  };
  customer: {
    fullName: string;
    email: string;
    phone: string;
    identityNumber: string;
  };
  booking: {
    startDate: string;
    endDate: string;
    guests: number;
    quantity: number;
    notes?: string;
  };
  addons: BookingAddonLine[];
  pricing: {
    subtotal: number;
    addonTotal: number;
    total: number;
  };
  payment?: {
    provider: "xendit";
    invoiceId?: string;
    invoiceUrl?: string;
    status?: string;
    paidAt?: string;
  };
}

const DRAFT_KEY = "booking_flow_draft_v2";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function makeOrderCode(prefix = "DLV"): string {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export function saveBookingDraft(draft: BookingDraft): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function getBookingDraft(): BookingDraft | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DRAFT_KEY);
}
