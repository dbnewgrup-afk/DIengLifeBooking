import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import prisma from "../lib/db.js";
import { releaseBookingAvailability } from "./booking-availability.repo.js";

type ExpiryClient = Prisma.TransactionClient | typeof prisma;

const expiryBookingSelect = {
  id: true,
  listingId: true,
  status: true,
  paymentStatus: true,
  qty: true,
  startDate: true,
  endDate: true,
  listing: {
    select: {
      unitType: true,
    },
  },
} satisfies Prisma.BookingSelect;

type ExpiryBookingRecord = Prisma.BookingGetPayload<{
  select: typeof expiryBookingSelect;
}>;

async function expireBooking(
  tx: Prisma.TransactionClient,
  booking: ExpiryBookingRecord,
  now: Date
) {
  const updated = await tx.booking.updateMany({
    where: {
      id: booking.id,
      paymentStatus: PaymentStatus.PENDING,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT],
      },
    },
    data: {
      status: BookingStatus.EXPIRED,
      paymentStatus: PaymentStatus.EXPIRED,
      cancelledAt: now,
    },
  });

  if (updated.count !== 1) {
    return false;
  }

  await releaseBookingAvailability(tx, {
    listingId: booking.listingId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    qty: booking.qty,
    unitType: booking.listing.unitType,
  });

  return true;
}

export async function syncExpiredBookings(
  client: ExpiryClient = prisma,
  now = new Date()
) {
  const expiredBookings = await client.booking.findMany({
    where: {
      paymentStatus: PaymentStatus.PENDING,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT],
      },
      expiresAt: {
        lte: now,
      },
    },
    select: expiryBookingSelect,
  });

  if (expiredBookings.length === 0) {
    return { expiredCount: 0 };
  }

  const txClient =
    "$transaction" in client && typeof client.$transaction === "function"
      ? client
      : prisma;

  let expiredCount = 0;

  await txClient.$transaction(async (tx) => {
    for (const booking of expiredBookings) {
      const expired = await expireBooking(tx, booking, now);
      if (expired) {
        expiredCount += 1;
      }
    }
  });

  return { expiredCount };
}
