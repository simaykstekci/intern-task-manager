import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

interface JwtPayload {
  userId: string
  email: string
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Bearer token missing.',
    })
    return
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.JWT_SECRET || 'dev-secret-key-fallback'

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }
    next()
  } catch (err: unknown) {
    res.status(401).json({
      error: 'Invalid or expired authentication token',
    })
  }
}
