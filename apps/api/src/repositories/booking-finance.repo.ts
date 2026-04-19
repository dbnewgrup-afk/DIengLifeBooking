import {
  Prisma,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@prisma/client";

type Tx = Prisma.TransactionClient;

type BookingSettlementSnapshot = {
  id: string;
  code: string;
  sellerId: string;
  totalAmount: number;
  platformFee: number;
  discountAmount: number;
  subtotal: number;
};

function getEscrowAmount(booking: BookingSettlementSnapshot) {
  return Math.max(0, booking.totalAmount - booking.platformFee);
}

async function ensureWallet(tx: Tx, sellerId: string) {
  const existing = await tx.wallet.findUnique({
    where: { sellerId },
    select: {
      id: true,
      balanceAvailable: true,
      balancePending: true,
    },
  });

  if (existing) {
    return existing;
  }

  return tx.wallet.create({
    data: { sellerId },
    select: {
      id: true,
      balanceAvailable: true,
      balancePending: true,
    },
  });
}

async function ensureCommissionTrace(
  tx: Tx,
  walletId: string,
  booking: BookingSettlementSnapshot
) {
  if (booking.platformFee <= 0) {
    return { amount: 0, created: false };
  }

  const existing = await tx.walletTransaction.findFirst({
    where: {
      bookingId: booking.id,
      type: WalletTransactionType.COMMISSION_OUT,
      status: WalletTransactionStatus.SUCCESS,
    },
    select: { id: true },
  });

  if (existing) {
    return { amount: booking.platformFee, created: false };
  }

  await tx.walletTransaction.create({
    data: {
      walletId,
      sellerId: booking.sellerId,
      bookingId: booking.id,
      type: WalletTransactionType.COMMISSION_OUT,
      amount: booking.platformFee,
      status: WalletTransactionStatus.SUCCESS,
      referenceCode: booking.code,
      description: `Platform fee captured for booking ${booking.code}`,
      meta: {
        totalAmount: booking.totalAmount,
        platformFee: booking.platformFee,
        discountAmount: booking.discountAmount,
        subtotal: booking.subtotal,
      },
    },
  });

  await tx.audit.create({
    data: {
      action: "WALLET_COMMISSION_CAPTURED",
      targetType: "BOOKING",
      targetId: booking.id,
      meta: {
        bookingCode: booking.code,
        sellerId: booking.sellerId,
        amount: booking.platformFee,
      },
    },
  });

  return { amount: booking.platformFee, created: true };
}

export async function ensureBookingEscrowBooked(
  tx: Tx,
  booking: BookingSettlementSnapshot
) {
  const amount = getEscrowAmount(booking);
  if (amount <= 0) {
    return { amount, created: false };
  }

  const existing = await tx.walletTransaction.findFirst({
    where: {
      bookingId: booking.id,
      type: WalletTransactionType.BOOKING_IN,
      status: WalletTransactionStatus.SUCCESS,
    },
    select: { id: true },
  });

  if (existing) {
    return { amount, created: false };
  }

  const wallet = await ensureWallet(tx, booking.sellerId);
  await ensureCommissionTrace(tx, wallet.id, booking);

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balancePending: {
        increment: amount,
      },
    },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      sellerId: booking.sellerId,
      bookingId: booking.id,
      type: WalletTransactionType.BOOKING_IN,
      amount,
      status: WalletTransactionStatus.SUCCESS,
      referenceCode: booking.code,
      description: `Booking ${booking.code} paid into escrow`,
      meta: {
        totalAmount: booking.totalAmount,
        platformFee: booking.platformFee,
        discountAmount: booking.discountAmount,
        subtotal: booking.subtotal,
      },
    },
  });

  await tx.audit.create({
    data: {
      action: "WALLET_ESCROW_BOOKED",
      targetType: "BOOKING",
      targetId: booking.id,
      meta: {
        bookingCode: booking.code,
        sellerId: booking.sellerId,
        amount,
      },
    },
  });

  return { amount, created: true };
}

export async function ensureBookingEscrowReleased(
  tx: Tx,
  booking: BookingSettlementSnapshot
) {
  const amount = getEscrowAmount(booking);
  if (amount <= 0) {
    return { amount, created: false };
  }

  const existing = await tx.walletTransaction.findFirst({
    where: {
      bookingId: booking.id,
      type: WalletTransactionType.ESCROW_RELEASE,
      status: WalletTransactionStatus.SUCCESS,
    },
    select: { id: true },
  });

  if (existing) {
    return { amount, created: false };
  }

  await ensureBookingEscrowBooked(tx, booking);

  const wallet = await ensureWallet(tx, booking.sellerId);
  if (wallet.balancePending < amount) {
    throw new Error(`Insufficient pending escrow for booking ${booking.code}`);
  }

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balancePending: {
        decrement: amount,
      },
      balanceAvailable: {
        increment: amount,
      },
    },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      sellerId: booking.sellerId,
      bookingId: booking.id,
      type: WalletTransactionType.ESCROW_RELEASE,
      amount,
      status: WalletTransactionStatus.SUCCESS,
      referenceCode: booking.code,
      description: `Escrow released for booking ${booking.code}`,
      meta: {
        totalAmount: booking.totalAmount,
        platformFee: booking.platformFee,
        discountAmount: booking.discountAmount,
        subtotal: booking.subtotal,
      },
    },
  });

  await tx.audit.create({
    data: {
      action: "WALLET_ESCROW_RELEASED",
      targetType: "BOOKING",
      targetId: booking.id,
      meta: {
        bookingCode: booking.code,
        sellerId: booking.sellerId,
        amount,
      },
    },
  });

  return { amount, created: true };
}
