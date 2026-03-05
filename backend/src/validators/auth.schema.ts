import { z } from 'zod';

// ── Send OTP ─────────────────────────────────────────────────────────────────
export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// ── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2).max(255),

  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),

  email: z.string().email(),

  password: z.string().min(6).max(255),

  // OTP that was verified in previous step
  otp: z.string().length(6, 'OTP must be 6 digits'),

  role: z.enum(['USER', 'ADMIN']).optional(),

  // Only required when role === 'ADMIN'
  adminCode: z.string().optional(),

  age: z.number().int().min(1).max(120).optional(),

  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),

  phone: z.string().min(8).max(20).optional(),

  location: z.string().max(255).optional(),
});

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  // username or email
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
