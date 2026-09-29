import { Router } from 'express'
import { register, login, getMe } from '../controllers/auth.controller.js'
import { validateRequest } from '../middleware/validate.middleware.js'
import { registerSchema, loginSchema } from '../validators/auth.validator.js'
import { requireAuth } from '../middleware/auth.middleware.js'

export const authRouter = Router()

// Public authentication routes
authRouter.post('/register', validateRequest(registerSchema), register)
authRouter.post('/login', validateRequest(loginSchema), login)

// Protected user profile route
authRouter.get('/me', requireAuth, getMe)
