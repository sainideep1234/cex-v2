import { z } from "zod";

export const symbolParamSchema = z.object({
  symbol: z.string().trim().min(1, "symbol is required"),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().trim().min(1, "orderId is required"),
});

const normalizeType = z.string().transform((val) => val.toLowerCase());
const normalizeSide = z.string().transform((val) => val.toLowerCase());

export const orderBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("limit"),
    side: z.enum(["buy", "sell"]),
    symbol: z.string().trim().min(1, "symbol is required"),
    price: z.number().positive("limit orders require a positive price"),
    qty: z.number().positive("qty must be a positive number"),
  }),
  z.object({
    type: z.literal("market"),
    side: z.enum(["buy", "sell"]),
    symbol: z.string().trim().min(1, "symbol is required"),
    price: z.null().optional(),
    qty: z.number().positive("qty must be a positive number"),
  }),
]);

// Wrapper that lowercases type and side before discriminatedUnion validation
export const orderBodySchemaWithNormalization = z
  .object({
    type: z.string(),
    side: z.string(),
    symbol: z.string().trim().min(1, "symbol is required"),
    price: z.number().positive().optional().nullable(),
    qty: z.number().positive("qty must be a positive number"),
  })
  .transform((data) => ({
    ...data,
    type: data.type.toLowerCase(),
    side: data.side.toLowerCase(),
  }))
  .pipe(orderBodySchema);
