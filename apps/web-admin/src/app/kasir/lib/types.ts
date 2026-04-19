export type CashierSummary = {
  walkinsToday: number;
  pendingPayments: number;
  checkinsToday: number;
  revenueToday: number;
  xenditAwaitingVerification: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  unit?: string;
  unitType?: string;
  locationText?: string;
};

export type CashierBookingRow = {
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  productName: string;
  listingId: string;
  listingType: string;
  unitType: string;
  locationText: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalDays: number;
  quantity: number;
  guestCount: number;
  status: string;
  paymentStatus: string;
  paymentProvider: string | null;
  paymentMethod: string | null;
  paymentExternalId: string | null;
  invoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  isWalkIn: boolean;
  source: "WALKIN_CASHIER" | "ONLINE";
};

export type CashierOverviewResponse = {
  ok: true;
  summary: CashierSummary;
  recentBookings: CashierBookingRow[];
  pendingPayments: CashierBookingRow[];
  pendingXendit: CashierBookingRow[];
};

export type ProductsResponse = {
  ok: true;
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateWalkInPayload = {
  listingId: string;
  startDate: string;
  endDate?: string | null;
  quantity: number;
  guestCount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  affiliateReference?: string | null;
  note?: string | null;
};

export type CreateWalkInResponse = {
  ok: true;
  booking: CashierBookingRow;
};

export type ManualPaymentPayload = {
  amount?: number;
  method: "CASH" | "TRANSFER";
  note?: string | null;
};

export type ManualPaymentResponse = {
  ok: true;
  booking: CashierBookingRow;
};

export type VerifyXenditResponse = {
  ok: true;
  booking: CashierBookingRow;
  invoice: {
    id: string | null;
    externalId: string;
    status: string;
    amount: number;
    invoiceUrl: string | null;
    paidAt: string | null;
    expiryDate: string | null;
    payerEmail: string | null;
  };
};
