import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { prisma } from '../lib/prisma.js';
import { registerSchema } from '../validators/auth.schema.js';
dotenv.config({});

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 5;

const registerUser = async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = registerSchema.parse(req.body);

    const email = data.email.toLowerCase().trim();
    const username = data.username.trim();

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        msg: 'User with email or username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user safely (no spreading user input)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        username,
        password: hashedPassword,
        age: data.age ?? null,
        gender: data.gender ?? null,
        phone: data.phone ?? null,
        location: data.location ?? null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      msg: 'User registered successfully ✅',
      user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        msg: 'Validation failed',
        errors: error.flatten(),
      });
    }

    console.error('Register Error:', error);

    return res.status(500).json({
      msg: 'Internal server error',
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        msg: 'Identifier and password are required',
      });
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Find by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        msg: 'Invalid credentials',
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        msg: 'Invalid credentials',
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(200).json({
      msg: 'Login successful ✅',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);

    return res.status(500).json({
      msg: 'Login failed',
    });
  }
};

const logoutUser = async (_req: Request, res: Response) => {
  // JWT logout handled client-side (delete token)
  return res.status(200).json({
    msg: 'Logout successful',
  });
};

export { loginUser, logoutUser, registerUser };
