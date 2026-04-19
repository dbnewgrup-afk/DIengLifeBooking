import { z } from "zod";

export const PayMethod = z.enum(["xendit", "cash", "whatsapp"]);

const CreateOrderAddon = z.object({
  key: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(120),
  price: z.number().nonnegative(),
  enabled: z.boolean(),
});

export const CreateOrderCustomer = z.object({
  name: z.string().min(1),
  phone: z.string().min(6).max(32),
  email: z.string().email().optional(),
  identityNumber: z.string().trim().min(3).max(120).optional(),
});

export const CreateOrderSchedule = z.object({
  time: z.string().trim().min(1).max(32).optional(),
  hours: z.coerce.number().int().positive().optional(),
  route: z.string().trim().min(1).max(160).optional(),
});

export const CreateOrderAffiliateAttribution = z.object({
  code: z.string().trim().min(2).max(64),
  landingPath: z.string().trim().max(500),
  capturedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  visitorKey: z.string().trim().min(6).max(120),
  sessionKey: z.string().trim().min(6).max(120),
});

const CreateOrderItemBase = z.object({
  itemId: z.string().trim().min(1).max(64).optional(),
  productId: z.string().min(1).optional(),
  listingId: z.string().min(1).optional(),
  promoCode: z.string().trim().min(3).max(50).optional(),
  qty: z.coerce.number().int().positive().default(1),
  guestCount: z.coerce.number().int().positive().default(1),
  notes: z.string().trim().max(2000).optional(),
  addons: z.array(CreateOrderAddon).default([]),

  // Booking opsi tanggal (untuk villa)
  start: z.string().optional(), // ISO date
  end: z.string().optional(),   // ISO date
  schedule: CreateOrderSchedule.optional(),
});

export const CreateOrderItemBody = CreateOrderItemBase.refine((value) => Boolean(value.productId || value.listingId), {
  message: "listingId or productId is required",
  path: ["listingId"],
});

const CreateSingleOrderBody = CreateOrderItemBase.extend({
  customer: CreateOrderCustomer.optional(),
  affiliateReference: z.string().trim().min(2).max(64).optional(),
  affiliateAttribution: CreateOrderAffiliateAttribution.optional(),
  payMethod: PayMethod.default("cash"),
}).refine((value) => Boolean(value.productId || value.listingId), {
  message: "listingId or productId is required",
  path: ["listingId"],
});

const CreateCartOrderBody = z.object({
  mode: z.literal("cart"),
  orderCode: z.string().trim().min(4).max(64).optional(),
  customer: CreateOrderCustomer,
  affiliateReference: z.string().trim().min(2).max(64).optional(),
  affiliateAttribution: CreateOrderAffiliateAttribution.optional(),
  items: z.array(CreateOrderItemBody).min(1),
  payMethod: PayMethod.default("cash"),
});

export const CreateOrderBody = z.union([CreateCartOrderBody, CreateSingleOrderBody]);

export const VerifyOrderParams = z.object({
  code: z.string().min(4),
});

export const GetOrderParams = VerifyOrderParams;

export const MarkCashParams = VerifyOrderParams;
export const CompleteOrderParams = VerifyOrderParams;









