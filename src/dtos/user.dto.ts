import z, { email } from "zod";
import { userSchema } from "../types/user.type";

export const createUserDTO = userSchema
  .pick({
    email: true,
    password: true,
  })
  .extend({
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Those passwords didn’t match. Try again.",
    path: ["confirmPassword"],
  });
export type createUserDTO = z.infer<typeof createUserDTO>;

export const loginUserDTO = z.object({
  email: z.email(),
  password: z.string().min(8),
});
export type loginUserDTO = z.infer<typeof loginUserDTO>;
