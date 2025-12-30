import z from "zod";

export const userSchema = z.object({
    email:z.email(),
    password:z.string().min(8),
    role: z.enum(["user", "admin"]).default("user"),
});

export type userType = z.infer<typeof userSchema>;