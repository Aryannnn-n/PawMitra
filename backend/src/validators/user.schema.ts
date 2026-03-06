import { z } from 'zod';

// ── Update Profile ────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),

  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric')
    .optional(),

  email: z.string().email().optional(),

  age: z.number().int().min(1).max(120).optional(),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),

  phone: z.string().min(8).max(20).optional(),

  location: z.string().max(255).optional(),
});

// ── Change Password ───────────────────────────────────────────────────────────
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(255),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
