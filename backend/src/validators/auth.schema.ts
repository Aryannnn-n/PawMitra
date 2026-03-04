import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(255),

  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),

  email: z.string().email(),

  password: z.string().min(6).max(255),

  role: z.enum(['USER', 'ADMIN']).optional(),

  age: z.number().int().min(1).max(120).optional(),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),

  phone: z.string().min(8).max(20).optional(),

  location: z.string().max(255).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
