import z from "zod";

export const createProductDTO = z.object({
  name: z.string().min(1, "Product name required"),
  price: z.coerce.number().min(0, "Price must be positive"),
});

export const updateProductDTO = createProductDTO.partial();

export type CreateProductDTO = z.infer<typeof createProductDTO>;
export type UpdateProductDTO = z.infer<typeof updateProductDTO>;
