import z from "zod";
import { userSchema } from "../types/user.type";

export const createUserDTO = userSchema
  .pick({
    email: true,
    password: true,
    role: true,
  })
  .extend({
    confirmPassword: z.string().min(8),
    imageUrl: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Those passwords didn’t match. Try again.",
    path: ["confirmPassword"],
  });

export type createUserDTO = z.infer<typeof createUserDTO>;

export const loginUserDTO = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type loginUserDTO = z.infer<typeof loginUserDTO>;

export const updateUserDTO = userSchema
  .partial()
  .extend({
    confirmPassword: z.string().min(8).optional(),
    imageUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Those passwords didn’t match. Try again.",
      path: ["confirmPassword"],
    },
  );

export type updateUserDTO = z.infer<typeof updateUserDTO>;
