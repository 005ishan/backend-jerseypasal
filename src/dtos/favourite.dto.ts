import z from "zod";

export const toggleFavouriteDTO = z.object({
  productId: z.string().min(1),
});

export type ToggleFavouriteDTO = z.infer<typeof toggleFavouriteDTO>;
