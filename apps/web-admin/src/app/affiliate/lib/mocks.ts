/* apps/web-admin/src/app/affiliate/lib/mocks.ts */

import type {
  AffiliateProfile,
  PerformanceToday,
  PayoutInfo,
  LinksData,
  WithdrawReq,
} from "./utils";

export const MOCK_PROFILE: AffiliateProfile = {
  id: "aff-001",
  code: "AFF-MANTAP",
  name: "Affiliate Kece",
  mainLink: "https://booking-villa.example.com/?aff=AFF-MANTAP",
};

export const MOCK_PERF: PerformanceToday = {
  clicks: 124,
  conversions: 9,
  pendingCommission: 450_000,
  cr: 9 / 124,
};

export const MOCK_PAYOUT: PayoutInfo = {
  pending: 1_250_000,
  lastPaidAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  lastPaidAmount: 2_000_000,
  nextCutoff: new Date(Date.now() + 86400000 * 3).toISOString(),
};

export const MOCK_LINKS: LinksData = {
  main: "https://booking-villa.example.com/?aff=AFF-MANTAP",
  short: "https://bv.la/mantap",
  utm: "utm_source=affiliate&utm_medium=link&utm_campaign=AFF-MANTAP",
};

export const MOCK_REQS: WithdrawReq[] = [
  {
    id: "WR-001",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    amount: 750_000,
    bank: "BCA",
    account: "1234567890",
    owner: "Affiliate Kece",
    status: "APPROVED",
  },
  {
    id: "WR-002",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    amount: 500_000,
    bank: "BNI",
    account: "0099887766",
    owner: "Affiliate Kece",
    status: "PENDING",
  },
];
