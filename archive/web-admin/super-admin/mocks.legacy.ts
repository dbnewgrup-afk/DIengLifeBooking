/**
 * DO NOT USE - legacy.
 * Arsip mock lama Super Admin sebelum panel-panel memakai data backend.
 * File ini dipindah ke luar project aktif agar tidak ikut import maupun type-check aplikasi.
 */

import type {
  Kpi,
  AffiliateRow,
  ApprovalItem,
  AuditItem,
  CmsEntry,
  PartnerRow,
  PayoutSummary,
  Product,
  Reports,
} from "../../../apps/web-admin/src/app/super-admin/lib/types";

const now = new Date().toISOString();

export const MOCK_KPI: Kpi = {
  bookingToday: 12,
  checkinToday: 8,
  checkoutToday: 4,
  pendingPayments: 3,
};

export const MOCK_AFFILIATES: AffiliateRow[] = [
  { id: "1", name: "Andi", code: "AFF-001", clicks: 120, conv: 12, pending: 250000 },
  { id: "2", name: "Budi", code: "AFF-002", clicks: 90, conv: 8, pending: 150000 },
];

export const MOCK_APPROVALS: ApprovalItem[] = [
  {
    id: "A1",
    code: "ORD-123",
    type: "REFUND",
    reason: "Salah tanggal",
    by: "Admin A",
    createdAt: now,
    status: "PENDING",
  },
  {
    id: "A2",
    code: "ORD-456",
    type: "DISCOUNT",
    reason: "Promo loyal",
    by: "Admin B",
    createdAt: now,
    status: "APPROVED",
  },
];

export const MOCK_AUDITS: AuditItem[] = [
  { id: "X1", actor: "Admin A", action: "UPDATE", target: "Order ORD-123", ts: now },
  { id: "X2", actor: "Admin B", action: "CREATE", target: "Product Villa Deluxe", ts: now },
];

export const MOCK_CMS: CmsEntry[] = [
  { id: "C1", title: "Draft Promo Akhir Tahun", status: "DRAFT", updatedAt: now },
  { id: "C2", title: "Artikel Tips Perjalanan", status: "PUBLISHED", updatedAt: now },
];

export const MOCK_PARTNERS: PartnerRow[] = [
  { id: "P1", name: "PT Maju Jaya", tier: "BASIC", status: "ACTIVE" },
  { id: "P2", name: "CV Suka Suka", tier: "PREMIUM", status: "INACTIVE" },
];

export const MOCK_PAYOUT: PayoutSummary = {
  pending: 750000,
  lastPaid: now,
  nextCutoff: new Date(Date.now() + 3 * 86400000).toISOString(),
  lastPaidAmount: 500000,
};

export const MOCK_PRODUCTS: Product[] = [
  { id: "PR1", name: "Villa Deluxe", price: 1200000, unit: "malam", active: true },
  { id: "PR2", name: "Sewa Jeep Gunung", price: 500000, unit: "paket", active: false },
];

export const MOCK_REPORTS: Reports = {
  occupancy: Array.from({ length: 7 }, (_, i) => ({
    label: `H-${6 - i}`,
    value: Math.floor(Math.random() * 100),
  })),
  revenue: Array.from({ length: 7 }, (_, i) => ({
    label: `H-${6 - i}`,
    value: Math.floor(Math.random() * 2000000),
  })),
  clicks: Array.from({ length: 7 }, (_, i) => ({
    label: `H-${6 - i}`,
    value: Math.floor(Math.random() * 200),
  })),
  // alias lama
  occupancy7d: [],
  bookings7d: [],
  revenue7d: [],
};
