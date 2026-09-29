import { type Response, type NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { type RegisterInput, type LoginInput } from '../validators/auth.validator.js'
import { type AuthRequest } from '../middleware/auth.middleware.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-fallback'
const JWT_EXPIRES_IN = '7d'

// Helper to sign JWT token
const signToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// POST /api/auth/register
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, fullName } = req.body as RegisterInput

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      res.status(409).json({
        error: 'Email already registered. Please login instead.',
      })
      return
    }

    // Hash password with salt
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user record in SQLite
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    })

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email })

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user,
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/auth/login
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      res.status(401).json({
        error: 'Invalid email or password',
      })
      return
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid email or password',
      })
      return
    }

    // Generate JWT token
    const token = signToken({ userId: user.id, email: user.email })

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/auth/me (Protected Route)
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      res.status(404).json({
        error: 'User not found',
      })
      return
    }

    res.status(200).json({
      user,
    })
  } catch (error) {
    next(error)
  }
}
