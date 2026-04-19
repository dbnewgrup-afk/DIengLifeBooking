import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import prisma from "../lib/db.js";
import { ensureBookingEscrowBooked } from "./booking-finance.repo.js";

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
  sellerId: true,
  totalAmount: true,
  platformFee: true,
  discountAmount: true,
  subtotal: true,
  status: true,
  paymentStatus: true,
  paidAt: true,
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

async function resolveBookingForXenditInvoice(
  invoice: XenditInvoiceSnapshot
): Promise<XenditSyncBookingRecord> {
  const bookingCode = String(invoice.external_id ?? "").trim();
  const invoiceId = String(invoice.id ?? invoice.invoice_id ?? "").trim();

  if (bookingCode) {
    const booking = await prisma.booking.findUnique({
      where: { code: bookingCode },
      select: xenditSyncBookingSelect,
    });

    if (booking) {
      return booking;
    }
  }

  if (invoiceId) {
    const payment = await prisma.payment.findUnique({
      where: { externalId: invoiceId },
      select: {
        booking: {
          select: xenditSyncBookingSelect,
        },
      },
    });

    if (payment?.booking) {
      return payment.booking;
    }
  }

  if (bookingCode) {
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

export async function fetchXenditInvoice(externalId: string) {
  const secretKey = process.env.XENDIT_SECRET_KEY?.trim();
  if (!secretKey) {
    throw createHttpError(
      503,
      "XENDIT_SECRET_KEY belum terpasang di backend API."
    );
  }

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

export async function syncXenditInvoiceToBooking(
  invoice: XenditInvoiceSnapshot
): Promise<XenditSyncResult> {
  const booking = await resolveBookingForXenditInvoice(invoice);
  const bookingCode = booking.code;

  const latestManualPayment = booking.payments.find(
    (payment) => payment.provider === PaymentProvider.MANUAL
  );

  if (booking.paymentStatus === PaymentStatus.PAID && latestManualPayment) {
    return {
      bookingCode: booking.code,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentExternalId: latestManualPayment.externalId ?? null,
      invoiceStatus: String(invoice.status ?? "PENDING").trim().toUpperCase() || "PENDING",
      ignored: true,
      reason: "manual_payment_already_settled",
    };
  }

  const invoiceStatus = String(invoice.status ?? "PENDING").trim().toUpperCase() || "PENDING";
  const mappedStatus = mapXenditInvoiceStatus(invoiceStatus);
  const normalizedAmount = Number(invoice.amount ?? booking.totalAmount);
  const amount = Number.isFinite(normalizedAmount)
    ? Math.round(normalizedAmount)
    : booking.totalAmount;
  const paidAt = parseOptionalDate(invoice.paid_at) ?? new Date();
  const expiredAt = parseOptionalDate(invoice.expiry_date) ?? new Date();
  const paymentMethod =
    String(invoice.payment_method ?? invoice.payment_channel ?? "xendit_redirect").trim() ||
    "xendit_redirect";

  const shouldPreservePaidState =
    booking.paymentStatus === PaymentStatus.PAID &&
    mappedStatus.paymentStatus !== PaymentStatus.PAID;
  const shouldPreserveRefundedState =
    booking.paymentStatus === PaymentStatus.REFUNDED;

  const nextPaymentStatus = shouldPreserveRefundedState
    ? PaymentStatus.REFUNDED
    : shouldPreservePaidState
      ? PaymentStatus.PAID
      : mappedStatus.paymentStatus;
  const nextBookingStatus = shouldPreserveRefundedState
    ? BookingStatus.REFUNDED
    : resolveNextBookingStatus(
        booking.status,
        mappedStatus.bookingStatus,
        nextPaymentStatus
      );
  const paymentExternalId = String(
    invoice.id ?? invoice.invoice_id ?? `xendit-${booking.code}`
  ).trim();

  await prisma.$transaction(async (tx) => {
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
      amount,
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
  });

  return {
    bookingCode: booking.code,
    bookingStatus: nextBookingStatus,
    paymentStatus: nextPaymentStatus,
    paymentExternalId,
    invoiceStatus,
    ...(shouldPreservePaidState
      ? {
          ignored: true,
          reason: "stale_non_paid_event_after_paid",
        }
      : {}),
  };
}
