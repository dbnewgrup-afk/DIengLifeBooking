import { ListingUnitType, Prisma } from "@prisma/client";

type AvailabilityTx = Prisma.TransactionClient;

type BookingAvailabilityInput = {
  listingId: string;
  startDate: Date;
  endDate: Date;
  qty: number;
  unitType: ListingUnitType;
};

function normalizeDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function enumerateReservationDates(input: BookingAvailabilityInput) {
  const start = normalizeDateOnly(input.startDate);
  const end = normalizeDateOnly(input.endDate);

  if (input.unitType === ListingUnitType.PER_NIGHT) {
    const dates: Date[] = [];
    for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
      dates.push(cursor);
    }
    return dates.length > 0 ? dates : [start];
  }

  return [start];
}

async function updateAvailabilitySlot(
  tx: AvailabilityTx,
  listingId: string,
  date: Date,
  qty: number
) {
  const existing = await tx.listingAvailability.findUnique({
    where: {
      listingId_date: {
        listingId,
        date,
      },
    },
    select: {
      id: true,
      stock: true,
      reservedCount: true,
      isAvailable: true,
      lockVersion: true,
    },
  });

  if (!existing) {
    const error = new Error("Ketersediaan produk untuk tanggal ini belum diatur oleh admin.") as Error & {
      status?: number;
    };
    error.status = 409;
    throw error;
  }

  const remainingStock = existing.stock - existing.reservedCount;
  if (!existing.isAvailable || remainingStock < qty) {
    const error = new Error("Stok tidak mencukupi untuk tanggal yang dipilih.") as Error & {
      status?: number;
    };
    error.status = 409;
    throw error;
  }

  const updated = await tx.listingAvailability.updateMany({
    where: {
      id: existing.id,
      lockVersion: existing.lockVersion,
    },
    data: {
      reservedCount: {
        increment: qty,
      },
      lockVersion: {
        increment: 1,
      },
    },
  });

  if (updated.count !== 1) {
    const error = new Error("Slot ketersediaan sedang dipakai pengguna lain. Coba ulang checkout.") as Error & {
      status?: number;
    };
    error.status = 409;
    throw error;
  }
}

async function decrementAvailabilitySlot(
  tx: AvailabilityTx,
  listingId: string,
  date: Date,
  qty: number
) {
  const existing = await tx.listingAvailability.findUnique({
    where: {
      listingId_date: {
        listingId,
        date,
      },
    },
    select: {
      id: true,
      reservedCount: true,
      lockVersion: true,
    },
  });

  if (!existing || existing.reservedCount <= 0) {
    return;
  }

  const decrementBy = Math.min(existing.reservedCount, qty);

  await tx.listingAvailability.updateMany({
    where: {
      id: existing.id,
      lockVersion: existing.lockVersion,
    },
    data: {
      reservedCount: {
        decrement: decrementBy,
      },
      lockVersion: {
        increment: 1,
      },
    },
  });
}

export async function reserveBookingAvailability(
  tx: AvailabilityTx,
  input: BookingAvailabilityInput
) {
  const qty = Math.max(1, Math.floor(input.qty));
  const dates = enumerateReservationDates(input);

  for (const date of dates) {
    await updateAvailabilitySlot(tx, input.listingId, date, qty);
  }
}

export async function releaseBookingAvailability(
  tx: AvailabilityTx,
  input: BookingAvailabilityInput
) {
  const qty = Math.max(1, Math.floor(input.qty));
  const dates = enumerateReservationDates(input);

  for (const date of dates) {
    await decrementAvailabilitySlot(tx, input.listingId, date, qty);
  }
}
