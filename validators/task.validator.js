import { z } from 'zod';
export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const createTaskSchema = z.object({
    title: z
        .string({ required_error: 'Task title is required' })
        .trim()
        .min(1, 'Task title cannot be empty')
        .max(150, 'Task title cannot exceed 150 characters'),
    description: z
        .string()
        .trim()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    status: TaskStatusEnum.optional().default('TODO'),
    priority: TaskPriorityEnum.optional().default('MEDIUM'),
    dueDate: z
        .string()
        .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
        .optional()
        .nullable(),
    projectId: z.string().uuid('Invalid project ID format').optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(30)).optional().default([]),
});
export const updateTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Task title cannot be empty')
        .max(150, 'Task title cannot exceed 150 characters')
        .optional(),
    description: z
        .string()
        .trim()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional()
        .nullable(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    dueDate: z
        .string()
        .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
        .optional()
        .nullable(),
    projectId: z.string().uuid('Invalid project ID format').optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(30)).optional(),
});
export const taskQuerySchema = z.object({
    search: z.string().optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    projectId: z.string().optional(),
    tag: z.string().optional(),
    sortBy: z.enum(['dueDate', 'createdAt', 'priority', 'status', 'title']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
