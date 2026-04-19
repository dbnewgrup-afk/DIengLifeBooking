// apps/web-admin/src/lib/api/schemas.ts

// ===== Enums =====
// Canonical role:
// - `SELLER`
// Legacy compatibility:
// - `PARTNER` -> harus diperlakukan sebagai alias ke `SELLER`
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "KASIR"
  | "PARTNER"
  | "AFFILIATE"
  | "SELLER"
  | "USER";
export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
export type PayoutStatus =
  | "DRAFT"
  | "REQUESTED"
  | "PROCESSING"
  | "PAID"
  | "FAILED";

// ===== Util Types =====
export type ID = string;
export type DateISO = string; // ISO 8601
export type Money = { currency: "IDR"; amount: number }; // rupiah integer

// ===== Products =====
export type ProductBase = {
  id: ID;
  slug: string;
  name: string;
  status: ProductStatus;
  createdAt: DateISO;
  updatedAt: DateISO;
};

export type ProductVilla = ProductBase & {
  kind: "villa";
  pricePerNight: number;
  maxPax: number;
  baseCapacity?: number;
};

export type ProductJeep = ProductBase & {
  kind: "jeep";
  pricePerHour: number;
};

export type ProductTransport = ProductBase & {
  kind: "transport";
  pricePerRoute: number;
  routeOptions?: string[];
};

export type ProductDokumentasi = ProductBase & {
  kind: "dokumentasi";
  priceFlat: number;
};

export type Product =
  | ProductVilla
  | ProductJeep
  | ProductTransport
  | ProductDokumentasi;

// ===== Orders =====
// Catatan compat:
// FE schema ini masih memakai istilah `Order` untuk sebagian type lama,
// tetapi source of truth transaksi aktif di backend adalah `Booking + Payment`.
export type OrderItemVilla = {
  kind: "villa";
  productId: ID;
  name: string;
  pricePerNight: number;
  start: DateISO;
  end: DateISO;
  pax: number;
  baseCapacity: number;
};

export type OrderItemJeep = {
  kind: "jeep";
  productId: ID;
  name: string;
  pricePerHour: number;
  date: DateISO;
  time: string; // HH:mm
  hours: number;
};

export type OrderItemTransport = {
  kind: "transport";
  productId: ID;
  name: string;
  pricePerRoute: number;
  date: DateISO;
  route?: string;
};

export type OrderItemDok = {
  kind: "dokumentasi";
  productId: ID;
  name: string;
  priceFlat: number;
  date: DateISO;
};

export type OrderItem =
  | OrderItemVilla
  | OrderItemJeep
  | OrderItemTransport
  | OrderItemDok;

export type OrderAmounts = {
  subtotal: number;
  fees: number;
  discount: number;
  total: number;
};

export type PaymentInfo = {
  channel?: "xendit" | "cash";
  snapToken?: string;
  settlementTime?: DateISO;
  transactionId?: string;
};

export type Customer = {
  name: string;
  phone?: string;
  email?: string;
};

export type Order = {
  id: ID;
  code: string;
  status: OrderStatus;
  items: OrderItem[];
  amounts: OrderAmounts;
  customer: Customer;
  payment: PaymentInfo;
  createdAt: DateISO;
  updatedAt: DateISO;
};

// ===== Affiliates / Partners =====
export type Partner = {
  id: ID;
  name: string;
  contact?: string;
};

export type Affiliate = {
  id: ID;
  name: string;
  code: string;
  partnerId?: ID;
  active: boolean;
  createdAt: DateISO;
};

// ===== Payouts =====
export type PayoutItem = {
  id: ID;
  orderCode: string;
  payeeId: ID;
  payeeType: "PARTNER" | "AFFILIATE";
  amount: number; // rupiah
  status: PayoutStatus;
  note?: string;
};

export type PayoutBatch = {
  id: ID;
  ref: string;
  status: PayoutStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: DateISO;
  processedAt?: DateISO;
};

// ===== Reports =====
export type ReportRowSales = {
  date: DateISO;
  orders: number;
  gross: number;
  net: number;
};

export type ReportRowAffiliates = {
  affiliateCode: string;
  orders: number;
  revenue: number;
};

export type ReportPayload<T> = {
  rows: T[];
  generatedAt: DateISO;
};

// ===== API Wrappers (konvensi FE) =====
export type ApiItem<T> = { data: T };
export type ApiList<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

// Query konvensi
export type ListQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
};

// ===== Error Model (untuk client.ts) =====
export type ApiError = {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
};
