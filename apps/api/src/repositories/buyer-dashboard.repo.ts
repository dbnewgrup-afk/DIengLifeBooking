import { BookingStatus, PaymentStatus } from "@prisma/client";
import prisma from "../lib/db.js";
import {
  getBookingCustomerSnapshot,
  getBookingNoteText,
  parseBookingNotes,
} from "../utils/booking-notes.js";

function isPaidLike(status: BookingStatus, paymentStatus: PaymentStatus) {
  return (
    paymentStatus === PaymentStatus.PAID ||
    status === BookingStatus.PAID ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED
  );
}

export async function getBuyerDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      bookings: {
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        select: {
          id: true,
          code: true,
          totalAmount: true,
          subtotal: true,
          qty: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          paidAt: true,
          startDate: true,
          endDate: true,
          guestCount: true,
          buyerEmail: true,
          buyerPhone: true,
          notes: true,
          promoCode: true,
          listing: {
            select: {
              id: true,
              slug: true,
              title: true,
              type: true,
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              provider: true,
              status: true,
              paymentMethod: true,
              paidAt: true,
            },
          },
          review: {
            select: {
              id: true,
              status: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const paidBookings = user.bookings.filter((booking) =>
    isPaidLike(booking.status, booking.paymentStatus)
  );

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      joinedAt: user.createdAt.toISOString(),
    },
    overview: {
      totalOrders: user.bookings.length,
      totalPaidOrders: paidBookings.length,
      totalSpent: paidBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
    },
    paidProducts: paidBookings.map((booking) => {
      const noteData = parseBookingNotes(booking.notes);

      return {
        id: booking.id,
        code: booking.code,
        productId: booking.listing.id,
        slug: booking.listing.slug,
        name: booking.listing.title,
        type: booking.listing.type,
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
        subtotal: booking.subtotal,
        qty: booking.qty,
        paidAt:
          booking.payments[0]?.paidAt?.toISOString() ??
          booking.paidAt?.toISOString() ??
          booking.createdAt.toISOString(),
        promoCode: booking.promoCode,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        guestCount: booking.guestCount,
        notes: getBookingNoteText(noteData),
        identityNumber: getBookingCustomerSnapshot(noteData)?.identityNumber ?? null,
        review: booking.review
          ? {
              id: booking.review.id,
              status: booking.review.status,
              rating: booking.review.rating,
              comment: booking.review.comment,
              createdAt: booking.review.createdAt.toISOString(),
            }
          : null,
      };
    }),
    payments: user.bookings.map((booking) => {
      const noteData = parseBookingNotes(booking.notes);

      return {
        id: booking.id,
        code: booking.code,
        productName: booking.listing.title,
        totalAmount: booking.totalAmount,
        subtotal: booking.subtotal,
        qty: booking.qty,
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        guestCount: booking.guestCount,
        notes: getBookingNoteText(noteData),
        identityNumber: getBookingCustomerSnapshot(noteData)?.identityNumber ?? null,
        paymentMethod: booking.payments[0]?.paymentMethod ?? null,
        provider: booking.payments[0]?.provider ?? null,
        paidAt:
          booking.payments[0]?.paidAt?.toISOString() ??
          booking.paidAt?.toISOString() ??
          null,
        createdAt: booking.createdAt.toISOString(),
      };
    }),
  };
}
