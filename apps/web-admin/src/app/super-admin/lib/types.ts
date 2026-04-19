/* apps/web-admin/src/app/super-admin/lib/types.ts */

// KPI kecil di header
export type Kpi = {
  bookingToday: number;
  checkinToday: number;
  checkoutToday: number;
  pendingPayments: number;
  revenue?: number;
  avgOrderValue?: number;
  paidRate?: number;
};

export type AffiliateRow = {
  id: string;
  name: string;
  code: string;
  category: string;
  bookings: number;
  paidOrders: number;
  attributedRevenue: number;
  totalDiscount: number;
  isActive: boolean;
  updatedAt: string;
};

export type ApprovalItem = {
  id: string;
  code: string;
  type: "SELLER" | "LISTING" | "PAYOUT" | "AFFILIATE_WITHDRAW" | "REVIEW";
  reason: string;
  by: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "PROCESSING" | "FAILED";
};

export type DashboardNotice = {
  id: string;
  title: string;
  body: string;
  audience: "SELLER" | "AFFILIATE" | "ALL_USERS";
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByName?: string | null;
};

export type MonitoringActivity = {
  id: string;
  actorType: "SELLER" | "AFFILIATE";
  actorName: string;
  activityType: string;
  title: string;
  detail: string;
  status: string;
  amount: number | null;
  createdAt: string;
};

export type ControlSnapshot = {
  notices: {
    active: number;
  };
  sellers: {
    total: number;
    active: number;
    pendingReview: number;
    suspended: number;
    rejected: number;
  };
  affiliates: {
    total: number;
    active: number;
    inactive: number;
  };
  sellerActivities: MonitoringActivity[];
  affiliateActivities: MonitoringActivity[];
};

export type AuditItem = {
  id: string;
  actorName: string;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  createdAt: string;
  ipAddress?: string | null;
};

export type CmsEntry = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
};

export type PartnerRow = {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  status: "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  productCount: number;
  bookingCount: number;
  balanceAvailable: number;
  balancePending: number;
  createdAt?: string;
  updatedAt: string;
};

export type PayoutSummary = {
  totalBatches: number;
  draftCount: number;
  approvedCount: number;
  completedCount: number;
  totalAmount: number;
  lastBatchAt?: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  unitType: "PER_NIGHT" | "PER_DAY" | "PER_TRIP" | "PER_SESSION";
  price: number;
  status: string;
  locationText: string;
  maxGuest: number;
  sellerId?: string;
  sellerName: string;
  soldCount: number;
  createdAt?: string;
  updatedAt: string;
};

export type ProductAvailability = {
  id: string;
  date: string;
  stock: number;
  reservedCount: number;
  isAvailable: boolean;
  priceOverride: number | null;
  updatedAt: string;
};

export type Point = {
  label: string;
  value: number;
};

// Laporan: sediakan versi baru + alias ...7d untuk panel yang masih pakai nama lama
export type Reports = {
  occupancy: Point[];
  revenue: Point[];
  clicks: Point[];
  topProducts: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }>;
  methodSplit: Array<{
    name: string;
    count: number;
  }>;
};
