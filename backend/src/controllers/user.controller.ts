import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/user.schema.js';

const SALT_ROUNDS = 5;

// Safe user select — never expose password
const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  age: true,
  gender: true,
  phone: true,
  location: true,
  createdAt: true,
} as const;

// ── GET /api/users/me ────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: safeUserSelect,
    });

    if (!user) {
      res.status(404).json({ msg: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PUT /api/users/me ────────────────────────────────────────────────────────
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    // Check username uniqueness if being changed
    if (data.username) {
      const taken = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });
      if (taken) {
        res
          .status(409)
          .json({ msg: 'Username already taken. Please choose another.' });
        return;
      }
    }

    // Check email uniqueness if being changed
    if (data.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase().trim(),
          NOT: { id: userId },
        },
      });
      if (emailTaken) {
        res
          .status(409)
          .json({ msg: 'Email already registered. Please use another.' });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.username && { username: data.username }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.age !== undefined && { age: data.age }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.location !== undefined && { location: data.location }),
      },
      select: safeUserSelect,
    });

    res
      .status(200)
      .json({ msg: 'Profile updated successfully ✅', user: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('updateMe error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── PUT /api/users/change-password ───────────────────────────────────────────
export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body,
    );
    const userId = req.user!.id;

    // Fetch user with password for comparison
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ msg: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ msg: 'Current password is incorrect.' });
      return;
    }

    if (currentPassword === newPassword) {
      res
        .status(400)
        .json({ msg: 'New password must be different from current password.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.status(200).json({ msg: 'Password updated successfully 🔑' });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ msg: 'Validation failed', errors: error.flatten() });
      return;
    }
    console.error('changePassword error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── DELETE /api/users/me ─────────────────────────────────────────────────────
export const deleteMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.user.delete({ where: { id: userId } });

    res
      .status(200)
      .json({ msg: 'Account deleted successfully. Sorry to see you go 👋' });
  } catch (error) {
    console.error('deleteMe error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// ── GET /api/users/:id ───────────────────────────────────────────────────────
export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id as string, 10); // 10 -> parse string to decimal number

    if (isNaN(userId)) {
      res.status(400).json({ msg: 'Invalid user ID' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });

    if (!user) {
      res.status(404).json({ msg: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
