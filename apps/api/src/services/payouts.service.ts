import { CreateBatchBody, GetBatchParams, ApproveBatchParams, Paging } from "../schemas/payouts.schema.js";
import * as repo from "../repositories/payouts.repo.js";

export async function listBatches(rawQuery: unknown) {
  const q = Paging.parse(rawQuery);
  return repo.listBatches({ page: q.page, pageSize: q.pageSize });
}

export async function createBatch(rawBody: unknown, actorId: string | null) {
  const body = CreateBatchBody.parse(rawBody);
  return repo.createBatch({
    note: body.note,
    items: body.items,
    actorId: actorId || "SYSTEM",
  });
}

export async function approveBatch(rawParams: unknown, actorId: string | null) {
  const { id } = ApproveBatchParams.parse(rawParams);
  const result = await repo.approveBatch(id, { actorId: actorId || "SYSTEM" });
  if (!result) {
    const err: any = new Error("Batch not found");
    err.status = 404;
    throw err;
  }
  return result;
}

export async function getBatch(rawParams: unknown) {
  const { id } = GetBatchParams.parse(rawParams);
  const batch = await repo.getBatch(id);
  if (!batch) {
    const err: any = new Error("Batch not found");
    err.status = 404;
    throw err;
  }
  return batch;
}









