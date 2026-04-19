import { z } from "zod";

// contoh validator email
export const emailSchema = z.string().trim().email();

// contoh validator order code
export const orderCodeSchema = z.string().regex(/^ORD-[A-Z0-9]+$/);

// generic parse
export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  return parsed.data;
}

export const validate = parseOrThrow;
