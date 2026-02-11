import z from "zod";

export const createProductDTO = z.object({
  name: z.string().min(1, "Product name required"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
});

export type CreateProductDTO = z.infer<typeof createProductDTO>;
