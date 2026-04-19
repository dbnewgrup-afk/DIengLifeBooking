import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import prisma from "../lib/db.js";
import { ensureBookingEscrowBooked } from "./booking-finance.repo.js";
import { releaseBookingAvailability } from "./booking-availability.repo.js";

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export type XenditInvoiceSnapshot = {
  id?: string | null;
  invoice_id?: string | null;
  external_id?: string | null;
  status?: string | null;
  amount?: number | null;
  invoice_url?: string | null;
  paid_at?: string | null;
  expiry_date?: string | null;
  payer_email?: string | null;
  payment_method?: string | null;
  payment_channel?: string | null;
  reference_id?: string | null;
  event_type?: string | null;
};

export type XenditSyncResult = {
  bookingCode: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentExternalId: string | null;
  invoiceStatus: string;
  ignored?: boolean;
  reason?: string;
};

export type CreateGroupedXenditInvoiceInput = {
  orderCode: string;
  bookings: Array<{
    id: string;
    code: string;
    totalAmount: number;
  }>;
  amount: number;
  description: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string | null;
  }>;
  successRedirectUrl: string;
  failureRedirectUrl: string;
};

export type CreateGroupedXenditInvoiceResult = {
  orderCode: string;
  invoiceId: string | null;
  invoiceUrl: string | null;
  invoiceStatus: string;
};

export function mapXenditInvoiceStatus(status: string) {
  const normalized = status.trim().toUpperCase();

  if (normalized === "PAID" || normalized === "SETTLED") {
    return {
      bookingStatus: BookingStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
    };
  }

  if (normalized === "EXPIRED") {
    return {
      bookingStatus: BookingStatus.EXPIRED,
      paymentStatus: PaymentStatus.EXPIRED,
    };
  }

  if (normalized === "FAILED" || normalized === "VOIDED") {
    return {
      bookingStatus: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
    };
  }

  return {
    bookingStatus: BookingStatus.AWAITING_PAYMENT,
    paymentStatus: PaymentStatus.PENDING,
  };
}

function xenditAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function getRequiredXenditSecretKey() {
  const secretKey = process.env.XENDIT_SECRET_KEY?.trim();
  if (!secretKey) {
    throw createHttpError(
      503,
      "XENDIT_SECRET_KEY belum terpasang di backend API."
    );
  }

  return secretKey;
}

function parseOptionalDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const xenditSyncBookingSelect = {
  id: true,
  code: true,
  checkoutCode: true,
  listingId: true,
  sellerId: true,
  totalAmount: true,
  platformFee: true,
  discountAmount: true,
  subtotal: true,
  status: true,
  paymentStatus: true,
  paidAt: true,
  qty: true,
  startDate: true,
  endDate: true,
  listing: {
    select: {
      unitType: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
    select: {
      id: true,
      provider: true,
      status: true,
      externalId: true,
    },
  },
} satisfies Prisma.BookingSelect;

type XenditSyncBookingRecord = Prisma.BookingGetPayload<{
  select: typeof xenditSyncBookingSelect;
}>;

type ResolvedBookingGroup = {
  orderCode: string;
  bookings: XenditSyncBookingRecord[];
};

async function resolveBookingGroupForXenditInvoice(
  invoice: XenditInvoiceSnapshot
): Promise<ResolvedBookingGroup> {
  const orderCode = String(invoice.external_id ?? "").trim();
  const invoiceId = String(invoice.id ?? invoice.invoice_id ?? "").trim();

  if (orderCode) {
    const grouped = await prisma.booking.findMany({
      where: { checkoutCode: orderCode },
      select: xenditSyncBookingSelect,
    });

    if (grouped.length > 0) {
      return {
        orderCode,
        bookings: grouped,
      };
    }

    const single = await prisma.booking.findUnique({
      where: { code: orderCode },
      select: xenditSyncBookingSelect,
    });

    if (single) {
      return {
        orderCode: single.code,
        bookings: [single],
      };
    }
  }

  if (invoiceId) {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalId: invoiceId },
          { externalId: { startsWith: `${invoiceId}:` } },
        ],
      },
      select: {
        booking: {
          select: {
            code: true,
            checkoutCode: true,
          },
        },
      },
    });

    const fallbackCode = payment?.booking.checkoutCode ?? payment?.booking.code ?? null;

    if (fallbackCode) {
      const grouped = await prisma.booking.findMany({
        where: {
          OR: [
            { code: fallbackCode },
            { checkoutCode: fallbackCode },
          ],
        },
        select: xenditSyncBookingSelect,
      });

      if (grouped.length > 0) {
        return {
          orderCode: fallbackCode,
          bookings: grouped,
        };
      }
    }
  }

  if (orderCode) {
    throw createHttpError(404, "Booking tidak ditemukan untuk external_id Xendit.");
  }

  if (invoiceId) {
    throw createHttpError(404, "Payment tidak ditemukan untuk invoice_id Xendit.");
  }

  throw createHttpError(400, "Payload Xendit tidak punya external_id atau invoice_id.");
}

function resolveNextBookingStatus(
  currentStatus: BookingStatus,
  mappedStatus: BookingStatus,
  nextPaymentStatus: PaymentStatus
) {
  if (currentStatus === BookingStatus.COMPLETED || currentStatus === BookingStatus.REFUNDED) {
    return currentStatus;
  }

  if (nextPaymentStatus === PaymentStatus.PAID && currentStatus === BookingStatus.CONFIRMED) {
    return currentStatus;
  }

  return mappedStatus;
}

function shouldReleaseAvailability(status: PaymentStatus) {
  return status === PaymentStatus.EXPIRED || status === PaymentStatus.FAILED;
}

export async function fetchXenditInvoice(externalId: string) {
  const secretKey = getRequiredXenditSecretKey();

  const response = await fetch(
    `https://api.xendit.co/v2/invoices?external_id=${encodeURIComponent(externalId)}`,
    {
      headers: {
        Authorization: xenditAuthHeader(secretKey),
        "Content-Type": "application/json",
      },
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw createHttpError(
      response.status,
      "Gagal mengambil status invoice Xendit dari backend."
    );
  }

  const invoices = Array.isArray(payload) ? payload : payload ? [payload] : [];
  const invoice =
    invoices.find(
      (candidate) => String(candidate?.external_id ?? "").trim() === externalId
    ) ?? invoices[0];

  if (!invoice) {
    throw createHttpError(404, "Invoice Xendit tidak ditemukan untuk kode booking ini.");
  }

  return invoice as XenditInvoiceSnapshot;
}

export async function createGroupedXenditInvoice(
  input: CreateGroupedXenditInvoiceInput
): Promise<CreateGroupedXenditInvoiceResult> {
  const secretKey = getRequiredXenditSecretKey();

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: xenditAuthHeader(secretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: input.orderCode,
      amount: input.amount,
      currency: "IDR",
      description: input.description,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      customer: {
        given_names: input.customer.fullName,
        email: input.customer.email,
        mobile_number: input.customer.phone,
      },
      customer_notification_preference: {
        invoice_created: ["email"],
        invoice_paid: ["email"],
      },
      items: input.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category ?? "booking",
      })),
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw createHttpError(
      response.status,
      "Gagal membuat invoice Xendit sandbox dari backend."
    );
  }

  const invoice = payload as Record<string, unknown> | null;
  const invoiceId =
    typeof invoice?.id === "string" && invoice.id.trim().length > 0
      ? invoice.id.trim()
      : typeof invoice?.invoice_id === "string" && invoice.invoice_id.trim().length > 0
        ? invoice.invoice_id.trim()
        : null;
  const invoiceUrl =
    typeof invoice?.invoice_url === "string" && invoice.invoice_url.trim().length > 0
      ? invoice.invoice_url.trim()
      : null;
  const invoiceStatus =
    typeof invoice?.status === "string" && invoice.status.trim().length > 0
      ? invoice.status.trim().toUpperCase()
      : "PENDING";

  await prisma.$transaction(async (tx) => {
    for (const booking of input.bookings) {
      const existingPayment = await tx.payment.findFirst({
        where: {
          bookingId: booking.id,
          provider: PaymentProvider.XENDIT,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      const externalId = invoiceId
        ? `${invoiceId}:${booking.code}`
        : `${input.orderCode}:${booking.code}`;

      const paymentData = {
        provider: PaymentProvider.XENDIT,
        externalId,
        amount: booking.totalAmount,
        currency: "IDR",
        paymentMethod: "xendit_redirect",
        status: PaymentStatus.PENDING,
        invoiceUrl,
        rawPayload: (invoice ?? {}) as Prisma.InputJsonValue,
        paidAt: null,
        expiredAt: null,
      } satisfies Prisma.PaymentUncheckedUpdateInput;

      if (existingPayment) {
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: paymentData,
        });
      } else {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            ...paymentData,
          },
        });
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.AWAITING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          paidAt: null,
        },
      });
    }
  });

  return {
    orderCode: input.orderCode,
    invoiceId,
    invoiceUrl,
    invoiceStatus,
  };
}

export async function syncXenditInvoiceToBooking(
  invoice: XenditInvoiceSnapshot
): Promise<XenditSyncResult> {
  const resolved = await resolveBookingGroupForXenditInvoice(invoice);
  const primaryBooking = resolved.bookings[0];

  const latestManualPayment = resolved.bookings
    .flatMap((booking) => booking.payments)
    .find((payment) => payment.provider === PaymentProvider.MANUAL);

  if (resolved.bookings.every((booking) => booking.paymentStatus === PaymentStatus.PAID) && latestManualPayment) {
    return {
      bookingCode: resolved.orderCode,
      bookingStatus: primaryBooking.status,
      paymentStatus: primaryBooking.paymentStatus,
      paymentExternalId: latestManualPayment.externalId ?? null,
      invoiceStatus: String(invoice.status ?? "PENDING").trim().toUpperCase() || "PENDING",
      ignored: true,
      reason: "manual_payment_already_settled",
    };
  }

  const invoiceStatus = String(invoice.status ?? "PENDING").trim().toUpperCase() || "PENDING";
  const mappedStatus = mapXenditInvoiceStatus(invoiceStatus);
  const paidAt = parseOptionalDate(invoice.paid_at) ?? new Date();
  const expiredAt = parseOptionalDate(invoice.expiry_date) ?? new Date();
  const paymentMethod =
    String(invoice.payment_method ?? invoice.payment_channel ?? "xendit_redirect").trim() ||
    "xendit_redirect";
  const groupPaymentExternalId = String(
    invoice.id ?? invoice.invoice_id ?? `xendit-${resolved.orderCode}`
  ).trim();

  const shouldPreservePaidState = resolved.bookings.some(
    (booking) =>
      booking.paymentStatus === PaymentStatus.PAID &&
      mappedStatus.paymentStatus !== PaymentStatus.PAID
  );
  const shouldPreserveRefundedState = resolved.bookings.some(
    (booking) => booking.paymentStatus === PaymentStatus.REFUNDED
  );

  const nextPaymentStatus = shouldPreserveRefundedState
    ? PaymentStatus.REFUNDED
    : shouldPreservePaidState
      ? PaymentStatus.PAID
      : mappedStatus.paymentStatus;

  await prisma.$transaction(async (tx) => {
    for (const booking of resolved.bookings) {
      const nextBookingStatus = shouldPreserveRefundedState
        ? BookingStatus.REFUNDED
        : resolveNextBookingStatus(
            booking.status,
            mappedStatus.bookingStatus,
            nextPaymentStatus
          );
      const paymentExternalId = `${groupPaymentExternalId}:${booking.code}`;

      const existingXenditPayment = await tx.payment.findFirst({
        where: {
          bookingId: booking.id,
          provider: PaymentProvider.XENDIT,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      const xenditPaymentData = {
        provider: PaymentProvider.XENDIT,
        amount: booking.totalAmount,
        currency: "IDR",
        paymentMethod,
        status: nextPaymentStatus,
        invoiceUrl: invoice.invoice_url ?? null,
        rawPayload: invoice as Prisma.InputJsonValue,
        ...(nextPaymentStatus === PaymentStatus.PAID ? { paidAt } : {}),
        ...(nextPaymentStatus === PaymentStatus.EXPIRED ? { expiredAt } : {}),
      } satisfies Prisma.PaymentUncheckedUpdateInput;

      if (existingXenditPayment) {
        await tx.payment.update({
          where: { id: existingXenditPayment.id },
          data: {
            externalId: paymentExternalId,
            ...xenditPaymentData,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            externalId: paymentExternalId,
            ...xenditPaymentData,
          },
        });
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: nextBookingStatus,
          paymentStatus: nextPaymentStatus,
          ...(nextPaymentStatus === PaymentStatus.PAID ? { paidAt } : {}),
        },
      });

      if (nextPaymentStatus === PaymentStatus.PAID) {
        await ensureBookingEscrowBooked(tx, booking);
      }

      if (
        shouldReleaseAvailability(nextPaymentStatus) &&
        booking.paymentStatus !== nextPaymentStatus
      ) {
        await releaseBookingAvailability(tx, {
          listingId: booking.listingId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          qty: booking.qty,
          unitType: booking.listing.unitType,
        });
      }
    }
  });

  return {
    bookingCode: resolved.orderCode,
    bookingStatus: mappedStatus.bookingStatus,
    paymentStatus: nextPaymentStatus,
    paymentExternalId: groupPaymentExternalId,
    invoiceStatus,
    ...(shouldPreservePaidState
      ? {
          ignored: true,
          reason: "stale_non_paid_event_after_paid",
        }
      : {}),
  };
}
