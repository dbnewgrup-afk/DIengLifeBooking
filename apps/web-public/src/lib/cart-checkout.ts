import type { CartItem, CartTotals } from "@/store/cart";
import { getCartItemSubtotal, getCartTotals } from "@/store/cart";
import type { AffiliateAttribution } from "@/lib/affiliate-attribution";

export function makeCartOrderCode(prefix = "CRT"): string {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

export type CartCheckoutPayloadItem = {
  id: string;
  productId: string;
  kind: CartItem["kind"];
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type CartCheckoutPayload = {
  mode: "cart";
  orderCode: string;
  items: CartCheckoutPayloadItem[];
  summary: CartTotals;
};

export type CartCheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
};

export type CartCreateOrderRequest = {
  mode: "cart";
  orderCode: string;
  payMethod: "xendit" | "cash";
  affiliateReference?: string;
  affiliateAttribution?: AffiliateAttribution;
  customer: {
    name: string;
    email: string;
    phone: string;
    identityNumber: string;
  };
  items: Array<{
    itemId: string;
    listingId: string;
    qty: number;
    guestCount: number;
    start: string;
    end?: string;
    schedule?: {
      time?: string;
      hours?: number;
      route?: string;
    };
  }>;
};

function getUnitPrice(item: CartItem): number {
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

export function buildCartCheckoutPayload(
  items: CartItem[],
  orderCode = makeCartOrderCode()
): CartCheckoutPayload {
  return {
    mode: "cart",
    orderCode,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      kind: item.kind,
      name: item.name,
      quantity: item.quantity,
      unitPrice: getUnitPrice(item),
      subtotal: getCartItemSubtotal(item),
    })),
    summary: getCartTotals(items),
  };
}

export function buildCartCreateOrderRequest(
  items: CartItem[],
  orderCode: string,
  customer: CartCheckoutCustomer,
  affiliateAttribution?: AffiliateAttribution
): CartCreateOrderRequest {
  return {
    mode: "cart",
    orderCode,
    payMethod: "xendit",
    affiliateReference: affiliateAttribution?.code?.trim().toUpperCase() || undefined,
    affiliateAttribution,
    customer: {
      name: customer.fullName.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone.trim(),
      identityNumber: customer.identityNumber.trim(),
    },
    items: items.map((item) => {
      if (item.kind === "villa") {
        return {
          itemId: item.id,
          listingId: item.productId,
          qty: item.quantity,
          guestCount: item.pax,
          start: item.start,
          end: item.end,
        };
      }

      if (item.kind === "transport") {
        return {
          itemId: item.id,
          listingId: item.productId,
          qty: item.quantity,
          guestCount: 1,
          start: item.date,
          schedule: {
            time: item.time,
            route: item.route,
          },
        };
      }

      return {
        itemId: item.id,
        listingId: item.productId,
        qty: item.quantity,
        guestCount: 1,
        start: item.date,
        schedule: {
          time: item.time,
          hours: item.hours,
        },
      };
    }),
  };
}
