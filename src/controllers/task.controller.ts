import { type Response, type NextFunction } from 'express'
import { prisma } from '../db/prisma.js'
import { type AuthRequest } from '../middleware/auth.middleware.js'
import {
  type CreateTaskInput,
  type UpdateTaskInput,
  taskQuerySchema,
} from '../validators/task.validator.js'

// GET /api/tasks - List tasks with search, filter, and sort support
export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId

    // Validate query parameters
    const query = taskQuerySchema.parse(req.query)
    const { search, status, priority, projectId, tag, sortBy, sortOrder } = query

    // Build dynamic where clause for multi-tenant querying
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (tag) {
      where.tags = {
        some: {
          name: tag,
        },
      }
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    res.status(200).json({
      tasks,
      count: tasks.length,
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/tasks/:id - Get single task by ID
export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    if (!task) {
      res.status(404).json({
        error: 'Task not found',
      })
      return
    }

    res.status(200).json({
      task,
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/tasks - Create a new task
export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { title, description, status, priority, dueDate, projectId, tags } =
      req.body as CreateTaskInput

    // Verify projectId if provided
    if (projectId) {
      const projectExists = await prisma.project.findFirst({
        where: { id: projectId, userId },
      })
      if (!projectExists) {
        res.status(400).json({
          error: 'Specified project does not exist or does not belong to you',
        })
        return
      }
    }

    // Prepare tags connection or creation
    const tagConnectOrCreate = tags?.map((tagName) => ({
      where: { name: tagName.toLowerCase() },
      create: { name: tagName.toLowerCase() },
    }))

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
        projectId: projectId || null,
        tags: tagConnectOrCreate && tagConnectOrCreate.length > 0
          ? { connectOrCreate: tagConnectOrCreate }
          : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    res.status(201).json({
      message: 'Task created successfully',
      task,
    })
  } catch (error) {
    next(error)
  }
}

// PUT /api/tasks/:id - Update an existing task
export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const { title, description, status, priority, dueDate, projectId, tags } =
      req.body as UpdateTaskInput

    // Verify task existence and ownership
    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    })

    if (!existingTask) {
      res.status(404).json({
        error: 'Task not found',
      })
      return
    }

    // Verify projectId if updating project
    if (projectId) {
      const projectExists = await prisma.project.findFirst({
        where: { id: projectId, userId },
      })
      if (!projectExists) {
        res.status(400).json({
          error: 'Specified project does not exist or does not belong to you',
        })
        return
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (projectId !== undefined) updateData.projectId = projectId

    // Handle tag relationships if updated
    if (tags !== undefined) {
      updateData.tags = {
        set: [], // Clear current tags
        connectOrCreate: tags.map((tagName) => ({
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
        })),
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
    })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/tasks/:id - Delete a task
export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    })

    if (!existingTask) {
      res.status(404).json({
        error: 'Task not found',
      })
      return
    }

    await prisma.task.delete({
      where: { id },
    })

    res.status(200).json({
      message: 'Task deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/tags - List all tags
export const getTags = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    res.status(200).json({
      tags,
    })
  } catch (error) {
    next(error)
  }
}
