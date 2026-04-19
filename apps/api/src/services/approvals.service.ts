import { z } from "zod";

const CloseOpenRequestBody = z.object({
  action: z.enum(["CLOSE", "OPEN"]),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  note: z.string().max(200).optional()
});

// Placeholder service; nanti pindah ke Prisma saat model approvals dibuat
export async function list() {
  return { items: [], page: 1, pageSize: 10, total: 0 };
}

export async function create(rawBody: unknown, actorId: string | null) {
  const body = CloseOpenRequestBody.parse(rawBody);
  return { id: Date.now().toString(), actorId: actorId || "SYSTEM", ...body, status: "PENDING" as const };
}









