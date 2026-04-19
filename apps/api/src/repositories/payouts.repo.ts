import { Prisma } from '@prisma/client';
import {
  PaymentProvider,
  WalletTransactionStatus,
  WalletTransactionType,
  WithdrawStatus,
} from "@prisma/client";
import prisma from "../lib/db.js";

type BatchItemInput = {
  partnerId: string;
  amount: number;
};

type BatchSummary = {
  id: string;
  code: string;
  status: "DRAFT" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalAmount: number;
  createdAt: string;
  note?: string;
};

type WalletOps = {
  withdraw: typeof prisma.withdraw;
  wallet: typeof prisma.wallet;
};

function makeHttpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

function makeBatchCode() {
  const ts = Date.now().toString();
  return `PB-${ts.slice(-8)}`;
}

function mapItemStatus(status: WithdrawStatus) {
  switch (status) {
    case WithdrawStatus.PAID:
      return "PAID";
    case WithdrawStatus.REJECTED:
    case WithdrawStatus.FAILED:
    case WithdrawStatus.CANCELLED:
      return "FAILED";
    case WithdrawStatus.APPROVED:
    case WithdrawStatus.PROCESSING:
      return "APPROVED";
    default:
      return "PENDING";
  }
}

function mapBatchStatus(statuses: WithdrawStatus[]): BatchSummary["status"] {
  const failedStatuses = new Set<WithdrawStatus>([
    WithdrawStatus.REJECTED,
    WithdrawStatus.FAILED,
    WithdrawStatus.CANCELLED,
  ]);

  if (statuses.length === 0) return "FAILED";
  if (statuses.every((status) => status === WithdrawStatus.PAID)) return "COMPLETED";
  if (statuses.some((status) => status === WithdrawStatus.PROCESSING)) return "PROCESSING";
  if (statuses.some((status) => status === WithdrawStatus.APPROVED)) return "APPROVED";
  if (statuses.every((status) => failedStatuses.has(status))) {
    return "FAILED";
  }
  return "DRAFT";
}

async function getReservedWithdrawAmount(tx: WalletOps, sellerId: string) {
  const result = await tx.withdraw.aggregate({
    where: {
      sellerId,
      status: {
        in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED, WithdrawStatus.PROCESSING],
      },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

async function ensureWallet(
  tx: WalletOps,
  seller: {
    id: string;
    wallet: { id: string; balanceAvailable: number } | null;
  }
) {
  if (seller.wallet) {
    return seller.wallet;
  }

  return tx.wallet.create({
    data: {
      sellerId: seller.id,
    },
    select: {
      id: true,
      balanceAvailable: true,
    },
  });
}

function summarizeBatch(
  code: string,
  rows: Array<{
    amount: number;
    requestedAt: Date;
    status: WithdrawStatus;
    txDescription: string | null;
  }>
): BatchSummary {
  const createdAt = rows
    .map((row) => row.requestedAt.getTime())
    .sort((a, b) => a - b)[0];

  const note = rows.find((row) => row.txDescription)?.txDescription ?? undefined;
  return {
    id: code,
    code,
    status: mapBatchStatus(rows.map((row) => row.status)),
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    createdAt: new Date(createdAt).toISOString(),
    note,
  };
}

export async function listBatches(opts: { page: number; pageSize: number }) {
  const rows = await prisma.walletTransaction.findMany({
    where: {
      type: WalletTransactionType.WITHDRAW_REQUEST,
      referenceCode: { startsWith: "PB-" },
      withdrawId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      referenceCode: true,
      description: true,
      withdraw: {
        select: {
          amount: true,
          requestedAt: true,
          status: true,
        },
      },
    },
  });

  const grouped = new Map<
    string,
    Array<{ amount: number; requestedAt: Date; status: WithdrawStatus; txDescription: string | null }>
  >();

  for (const row of rows) {
    if (!row.referenceCode || !row.withdraw) continue;
    const items = grouped.get(row.referenceCode) ?? [];
    items.push({
      amount: row.withdraw.amount,
      requestedAt: row.withdraw.requestedAt,
      status: row.withdraw.status,
      txDescription: row.description,
    });
    grouped.set(row.referenceCode, items);
  }

  const all = Array.from(grouped.entries())
    .map(([code, items]) => summarizeBatch(code, items))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const { page, pageSize } = opts;
  const total = all.length;
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { items, page, pageSize, total };
}

export async function createBatch(opts: {
  note?: string;
  items: BatchItemInput[];
  actorId: string;
}) {
  const batchCode = makeBatchCode();
  const description = opts.note?.trim() || null;

  const created = await prisma.$transaction(async (tx) => {
    const results: Array<{
      amount: number;
      requestedAt: Date;
      status: WithdrawStatus;
      txDescription: string | null;
    }> = [];

    for (const item of opts.items) {
      const seller = await tx.sellerProfile.findUnique({
        where: { id: item.partnerId },
        select: {
          id: true,
          displayName: true,
          bankName: true,
          bankCode: true,
          accountNumber: true,
          accountName: true,
          wallet: {
            select: {
              id: true,
              balanceAvailable: true,
            },
          },
        },
      });

      if (!seller) {
        throw makeHttpError(404, `Partner ${item.partnerId} not found`);
      }

      if (!seller.bankCode || !seller.accountNumber || !seller.accountName) {
        throw makeHttpError(400, `Partner ${seller.displayName} has incomplete bank account data`);
      }

      const wallet = await ensureWallet(tx, seller);
      const reserved = await getReservedWithdrawAmount(tx, seller.id);
      const available = Math.max(0, wallet.balanceAvailable - reserved);
      if (item.amount > available) {
        throw makeHttpError(400, `Partner ${seller.displayName} has insufficient available balance`);
      }

      const withdraw = await tx.withdraw.create({
        data: {
          sellerId: seller.id,
          walletId: wallet.id,
          amount: item.amount,
          bankName: seller.bankName ?? undefined,
          bankCode: seller.bankCode,
          accountNumber: seller.accountNumber,
          accountName: seller.accountName,
          provider: PaymentProvider.XENDIT,
          status: WithdrawStatus.PENDING,
        },
        select: {
          id: true,
          amount: true,
          requestedAt: true,
          status: true,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          sellerId: seller.id,
          withdrawId: withdraw.id,
          type: WalletTransactionType.WITHDRAW_REQUEST,
          amount: item.amount,
          status: WalletTransactionStatus.PENDING,
          referenceCode: batchCode,
          description,
        },
      });

      results.push({
        amount: withdraw.amount,
        requestedAt: withdraw.requestedAt,
        status: withdraw.status,
        txDescription: description,
      });
    }

    return results;
  });

  return summarizeBatch(batchCode, created);
}

export async function approveBatch(id: string, _opts: { actorId: string }) {
  const items = await prisma.walletTransaction.findMany({
    where: {
      type: WalletTransactionType.WITHDRAW_REQUEST,
      referenceCode: id,
      withdrawId: { not: null },
    },
    select: {
      id: true,
      withdrawId: true,
    },
  });

  if (items.length === 0) return null;

  const withdrawIds = items
    .map((item) => item.withdrawId)
    .filter((withdrawId): withdrawId is string => Boolean(withdrawId));

  await prisma.$transaction(async (tx) => {
    await tx.withdraw.updateMany({
      where: {
        id: { in: withdrawIds },
        status: WithdrawStatus.PENDING,
      },
      data: {
        status: WithdrawStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
  });

  return getBatch(id);
}

export async function rejectBatch(id: string, _opts: { actorId: string; note?: string }) {
  const items = await prisma.walletTransaction.findMany({
    where: {
      type: WalletTransactionType.WITHDRAW_REQUEST,
      referenceCode: id,
      withdrawId: { not: null },
    },
    select: {
      id: true,
      withdrawId: true,
    },
  });

  if (items.length === 0) return null;

  const withdrawIds = items
    .map((item) => item.withdrawId)
    .filter((withdrawId): withdrawId is string => Boolean(withdrawId));

  await prisma.$transaction(async (tx) => {
    await tx.withdraw.updateMany({
      where: {
        id: { in: withdrawIds },
        status: {
          in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED],
        },
      },
      data: {
        status: WithdrawStatus.REJECTED,
        rejectedAt: new Date(),
        failureReason: _opts.note?.trim() || "Rejected by super admin",
      },
    });

    await tx.walletTransaction.updateMany({
      where: {
        id: { in: items.map((item) => item.id) },
        status: {
          in: [WalletTransactionStatus.PENDING, WalletTransactionStatus.SUCCESS],
        },
      },
      data: {
        status: WalletTransactionStatus.FAILED,
      },
    });
  });

  return getBatch(id);
}

export async function completeBatch(
  id: string,
  opts: { actorId: string; note?: string; disbursementReference?: string }
) {
  const rows = await prisma.walletTransaction.findMany({
    where: {
      type: WalletTransactionType.WITHDRAW_REQUEST,
      referenceCode: id,
      withdrawId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      walletId: true,
      sellerId: true,
      withdrawId: true,
      amount: true,
      description: true,
      withdraw: {
        select: {
          id: true,
          amount: true,
          status: true,
          walletId: true,
          sellerId: true,
          externalDisbursementId: true,
        },
      },
    },
  });

  if (rows.length === 0) {
    return null;
  }

  const payableRows = rows.filter(
    (row) =>
      row.withdraw &&
      (row.withdraw.status === WithdrawStatus.APPROVED ||
        row.withdraw.status === WithdrawStatus.PROCESSING)
  );

  const alreadyPaid = rows.every((row) => row.withdraw?.status === WithdrawStatus.PAID);
  if (payableRows.length === 0 && alreadyPaid) {
    return getBatch(id);
  }

  if (payableRows.length === 0) {
    throw makeHttpError(409, "Batch payout ini belum siap ditandai sebagai paid.");
  }

  const baseReference =
    opts.disbursementReference?.trim() || `${id}-${Date.now().toString().slice(-6)}`;

  await prisma.$transaction(async (tx) => {
    for (const [index, row] of payableRows.entries()) {
      const withdraw = row.withdraw;
      if (!withdraw) continue;

      const wallet = await tx.wallet.findUnique({
        where: { id: withdraw.walletId },
        select: {
          id: true,
          balanceAvailable: true,
        },
      });

      if (!wallet) {
        throw makeHttpError(404, `Wallet seller untuk withdraw ${withdraw.id} tidak ditemukan.`);
      }

      if (wallet.balanceAvailable < withdraw.amount) {
        throw makeHttpError(
          409,
          `Saldo available seller tidak cukup untuk menyelesaikan withdraw ${withdraw.id}.`
        );
      }

      const nextReference =
        withdraw.externalDisbursementId ??
        `${baseReference}-${String(index + 1).padStart(2, "0")}`;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceAvailable: {
            decrement: withdraw.amount,
          },
        },
      });

      await tx.withdraw.update({
        where: { id: withdraw.id },
        data: {
          status: WithdrawStatus.PAID,
          paidAt: new Date(),
          externalDisbursementId: nextReference,
          failureReason: null,
        },
      });

      await tx.walletTransaction.update({
        where: { id: row.id },
        data: {
          status: WalletTransactionStatus.SUCCESS,
          description: opts.note?.trim() || row.description || "Withdraw request settled",
        },
      });

      const existingPaidTx = await tx.walletTransaction.findFirst({
        where: {
          withdrawId: withdraw.id,
          type: WalletTransactionType.WITHDRAW_PAID,
          status: WalletTransactionStatus.SUCCESS,
        },
        select: { id: true },
      });

      if (!existingPaidTx) {
        await tx.walletTransaction.create({
          data: {
            walletId: withdraw.walletId,
            sellerId: withdraw.sellerId,
            withdrawId: withdraw.id,
            type: WalletTransactionType.WITHDRAW_PAID,
            amount: withdraw.amount,
            status: WalletTransactionStatus.SUCCESS,
            referenceCode: nextReference,
            description: opts.note?.trim() || `Withdraw paid for batch ${id}`,
            meta: {
              batchCode: id,
              actorId: opts.actorId,
            },
          },
        });
      }

      await tx.audit.create({
        data: {
          action: "WALLET_WITHDRAW_PAID",
          actorId: opts.actorId,
          targetType: "WITHDRAW",
          targetId: withdraw.id,
          meta: {
            batchCode: id,
            sellerId: withdraw.sellerId,
            walletId: withdraw.walletId,
            amount: withdraw.amount,
            disbursementReference: nextReference,
          },
        },
      });
    }
  });

  return getBatch(id);
}

export async function getBatch(id: string) {
  const rows = await prisma.walletTransaction.findMany({
    where: {
      type: WalletTransactionType.WITHDRAW_REQUEST,
      referenceCode: id,
      withdrawId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      description: true,
      withdraw: {
        select: {
          id: true,
          amount: true,
          requestedAt: true,
          status: true,
          failureReason: true,
          seller: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  if (rows.length === 0) {
    return null;
  }

  const normalized = rows
    .map((row) => {
      if (!row.withdraw) return null;
      return {
        amount: row.withdraw.amount,
        requestedAt: row.withdraw.requestedAt,
        status: row.withdraw.status,
        txDescription: row.description,
        item: {
          id: row.withdraw.id,
          partnerId: row.withdraw.seller.id,
          partnerName: row.withdraw.seller.displayName,
          amount: row.withdraw.amount,
          status: mapItemStatus(row.withdraw.status),
          note: row.withdraw.failureReason ?? row.description ?? undefined,
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const batch = summarizeBatch(
    id,
    normalized.map((row) => ({
      amount: row.amount,
      requestedAt: row.requestedAt,
      status: row.status,
      txDescription: row.txDescription,
    }))
  );

  return {
    ...batch,
    items: normalized.map((row) => row.item),
    total: normalized.length,
  };
}










