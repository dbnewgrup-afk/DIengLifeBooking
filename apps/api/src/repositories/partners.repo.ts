import { Prisma } from '@prisma/client';
/**
 * Repo stub untuk Partner. Model belum ada di Prisma.
 * Ganti implementasi ke Prisma nanti.
 */

export type Partner = {
  id: string;
  name: string;
  contact?: string;
  active: boolean;
};

export async function listPartners() {
  const items: Partner[] = [];
  return { items, page: 1, pageSize: 10, total: 0 };
}

export async function getPartner(id: string) {
  return null as Partner | null;
}

export async function createPartner(_data: Omit<Partner, "id">) {
  return { id: "PARTNER-001", name: "Partner Stub", active: true } as Partner;
}

export async function updatePartner(_id: string, _data: Partial<Partner>) {
  return null as Partner | null;
}










