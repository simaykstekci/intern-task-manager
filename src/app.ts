import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth.routes.js'
import { projectRouter } from './routes/project.routes.js'
import { taskRouter } from './routes/task.routes.js'

dotenv.config()

export const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Intern Task Manager API is running smoothly',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// Authentication API routes
app.use('/api/auth', authRouter)

// Project API routes
app.use('/api/projects', projectRouter)

// Task API routes
app.use('/api/tasks', taskRouter)

// 404 handler for undefined API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
  })
})

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})
