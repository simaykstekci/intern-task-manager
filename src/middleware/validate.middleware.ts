import { type Request, type Response, type NextFunction } from 'express'
import { ZodError, type AnyZodObject } from 'zod'

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body)
      next()
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))

        res.status(400).json({
          error: 'Validation failed',
          details: errorMessages,
        })
        return
      }

      next(error)
    }
  }
}
