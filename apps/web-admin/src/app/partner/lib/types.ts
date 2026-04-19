export type PartnerSummary = {
  bookingsToday: number;
  checkinsToday: number;
  checkoutsToday: number;
  pendingPayments: number;
  activeTransportSlots: number;
  activeDocsJobs: number;
  latestActivities: Array<{ id: string; text: string; ago: string }>;
};

export type PayoutRow = {
  id: string;
  createdAt: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED";
  note?: string;
};

export type BalanceInfo = {
  balance: number;
  available: number;
  pending: number;
  nextCutoff?: string;
};

export type WithdrawalReq = {
  id: string;
  createdAt: string;
  amount: number;
  target: { bank: string; accNo: string; accName: string };
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type ProductReq = {
  id: string;
  createdAt: string;
  product: { id: string; name: string; type: "VILLA" | "JEEP" | "RENT" | "DOCS" };
  action: "OPEN" | "CLOSE";
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type Owner = { id: string; name: string };

export type BookingRow = {
  id: string;
  code?: string;
  ownerId: string;
  ownerName: string;
  dateISO: string;
  guest: string;
  revenue: number;
  status?: string;
  paymentStatus?: string;
};

export type TabKey = "OVERVIEW" | "PAYOUTS" | "REQUESTS" | "REPORTS";
export type RequestSubTab = "WITHDRAW" | "PRODUCT";
export type GroupByKey = "DAY" | "WEEK" | "MONTH";
