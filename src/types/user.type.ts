import z from "zod";

export const userSchema = z.object({
    username: z.string().min(1),
    email:z.email(),
    passeord:z.string().min(8),
    firstName:z.string().optional(),
    lastName:z.string().optional(),
    role: z.enum(["user", "admin"]).default("user"),
});

export type UserType = z.infer<typeof userSchema>;