import { z } from 'zod'

// Validation schema for creating a project
export const createProjectSchema = z.object({
  title: z
    .string({ required_error: 'Project title is required' })
    .trim()
    .min(1, 'Project title cannot be empty')
    .max(100, 'Project title cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Color must be a valid hex code (e.g. #6366f1)')
    .optional()
    .default('#6366f1'),
})

// Validation schema for updating a project
export const updateProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Project title cannot be empty')
    .max(100, 'Project title cannot exceed 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Color must be a valid hex code (e.g. #6366f1)')
    .optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
