import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateOtp, sendOtpEmail } from '../services/email.service.js';
import {
  clearVerifiedEmail,
  deleteOtp,
  isEmailVerified,
  markEmailVerified,
  saveOtp,
  verifyOtp,
} from '../services/otp.store.js';
import {
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../validators/auth.schema.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const ADMIN_CODE = process.env.ADMIN_VERIFICATION_CODE as string;
const SALT_ROUNDS = 10;

// ── POST /api/auth/send-verification ────────────────────────────────────────
export const sendVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = sendOtpSchema.parse(req.body);

    const otp = generateOtp();
    saveOtp(email, otp);

    const sent = await sendOtpEmail(email, otp);

    if (!sent) {
      res
        .status(500)
        .json({ msg: 'Failed to send verification email. Please try again.' });
      return;
    }

    res.status(200).json({ msg: 'Verification code sent to your email.' });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('sendVerification error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/auth/verify ────────────────────────────────────────────────────
export const verifyCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const valid = verifyOtp(email, otp);

    if (!valid) {
      res.status(400).json({ msg: 'Invalid or expired verification code.' });
      return;
    }

    // Mark email as verified so register can proceed
    markEmailVerified(email);

    res.status(200).json({ msg: 'Email verified successfully!' });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('verifyCode error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/auth/register ──────────────────────────────────────────────────
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const email = data.email.toLowerCase().trim();
    const username = data.username.trim();

    // Check email was verified in the verify step
    if (!isEmailVerified(email)) {
      res
        .status(400)
        .json({ msg: 'Please verify your email before registering.' });
      return;
    }

    // Double-check OTP is still valid
    const otpValid = verifyOtp(email, data.otp);
    if (!otpValid) {
      res
        .status(400)
        .json({ msg: 'OTP expired. Please request a new verification code.' });
      return;
    }

    // Admin code check
    if (data.role === 'ADMIN') {
      if (!data.adminCode || data.adminCode !== ADMIN_CODE) {
        res.status(403).json({ msg: 'Invalid admin verification code.' });
        return;
      }
    }

    // Prevent duplicate email / username
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      res
        .status(409)
        .json({ msg: 'User with that email or username already exists.' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        username,
        password: hashedPassword,
        role: data.role ?? 'USER',
        age: data.age ?? null,
        gender: data.gender ?? null,
        phone: data.phone ?? null,
        location: data.location ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Clean up OTP store + verified set
    deleteOtp(email);
    clearVerifiedEmail(email);

    res.status(201).json({ msg: 'Registration successful ✅', user });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('registerUser error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);

    const normalized = identifier.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { username: normalized }],
      },
    });

    if (!user) {
      res.status(401).json({ msg: 'Invalid credentials' });
      return;
    }

    let passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      res.status(401).json({ msg: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      msg: 'Login successful ✅',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('loginUser error:', error);
    res.status(500).json({ msg: 'Login failed' });
  }
};

// ── POST /api/auth/logout ────────────────────────────────────────────────────
// JWT is stateless — client deletes the token. Server just acknowledges.
export const logoutUser = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res
    .status(200)
    .json({ msg: 'Logout successful. Please delete your token client-side.' });
};
