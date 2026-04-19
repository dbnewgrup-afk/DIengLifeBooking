import { API_BASE_URL, resolvePublicSession } from "@/lib/auth";

export type CanonicalOrderDetail = {
  code: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  qty: number;
  startDate?: string;
  endDate?: string;
  guestCount?: number;
  notes?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  createdAt?: string;
  bookingCodes?: string[];
  isMultiItem?: boolean;
  customer?: {
    name?: string | null;
    identityNumber?: string | null;
  } | null;
  promo?: {
    code: string;
    title: string;
  } | null;
  items: Array<{
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal?: number;
    type?: "listing" | "addon";
    bookingCode?: string;
    scheduleLabel?: string;
    detailLabel?: string;
  }>;
  payments: Array<{
    provider: string;
    status: string;
    externalId?: string | null;
    invoiceUrl?: string | null;
    paidAt?: string | null;
  }>;
};

export type CanonicalOrderLoadResult = {
  data: CanonicalOrderDetail | null;
  error: string | null;
  requiresAuth: boolean;
};

export async function fetchCanonicalOrderDetail(code: string): Promise<CanonicalOrderLoadResult> {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    return {
      data: null,
      error: "Kode booking tidak ditemukan.",
      requiresAuth: false,
    };
  }

  try {
    const session = await resolvePublicSession("USER");
    if (!session) {
      return {
        data: null,
        error: "Sesi buyer tidak ditemukan. Login sebagai buyer untuk melihat status booking dari backend.",
        requiresAuth: true,
      };
    }

    const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(normalizedCode)}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        data: null,
        error: json?.error || json?.message || "Detail order belum tersedia.",
        requiresAuth: response.status === 401 || response.status === 403,
      };
    }

    if (!json?.order) {
      return {
        data: null,
        error: "Detail order belum tersedia.",
        requiresAuth: false,
      };
    }

    return {
      data: json.order as CanonicalOrderDetail,
      error: null,
      requiresAuth: false,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Gagal memuat detail order.",
      requiresAuth: false,
    };
  }
}

export function getCanonicalPayment(order: CanonicalOrderDetail | null | undefined) {
  return order?.payments[0] ?? null;
}
