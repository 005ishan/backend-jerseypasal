import z from "zod";

export const addToCartDTO = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(1),
  size: z.enum(["S", "M", "L", "XL", "XXL"]),
});

export type AddToCartDTO = z.infer<typeof addToCartDTO>;
