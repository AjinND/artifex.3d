import { z } from "zod";
export const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .refine((v) => new TextEncoder().encode(v).length <= 72);
export const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    name: z.string().trim().min(2).max(50),
    password,
  })
  .strict();
export const updateUserSchema = createUserSchema.pick({ name: true }).strict();
export type CreateUserInput = z.infer<typeof createUserSchema>;
