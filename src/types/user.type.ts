import { z } from "zod";
import { JerseySize } from "./common.type";

// Zod schema for Favourite Item
export const favouriteItemSchema = z.object({
  product: z.string(),
  addedAt: z.date().default(() => new Date()),
});

// Zod schema for Cart Item
export const cartItemSchema = z.object({
  product: z.string(),
  quantity: z.number().min(1),
  size: z.nativeEnum(JerseySize),
  addedAt: z.date().default(() => new Date()),
});

export type CartItemType = z.infer<typeof cartItemSchema>;
export type FavouriteItemType = z.infer<typeof favouriteItemSchema>;

export const userSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]).default("user"),
  favourites: z.array(favouriteItemSchema).default([]),
  cart: z.array(cartItemSchema).default([]),
});

export type userType = z.infer<typeof userSchema>;
