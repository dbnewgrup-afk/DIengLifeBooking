export type AffiliateProfile = {
  id: string;
  code: string;
  name: string;
  mainLink: string;
};

export type PerformanceToday = {
  clicks: number;
  conversions: number;
  pendingCommission: number;
  cr?: number;
};

export type PayoutInfo = {
  pending: number;
  lastPaidAt?: string;
  lastPaidAmount?: number;
  nextCutoff?: string;
};

export type LinksData = {
  main: string;
  short?: string;
  utm?: string;
};

export type WithdrawReq = {
  id: string;
  createdAt: string; // ISO
  amount: number;
  bank: string;
  account: string;
  owner: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
};

export type TabKey = "OVERVIEW" | "LINKS" | "PAYOUT" | "PERFORMANCE";
