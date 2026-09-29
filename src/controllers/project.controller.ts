import { type Response, type NextFunction } from 'express'
import { prisma } from '../db/prisma.js'
import { type AuthRequest } from '../middleware/auth.middleware.js'
import { type CreateProjectInput, type UpdateProjectInput } from '../validators/project.validator.js'

// GET /api/projects - List all projects for authenticated user
export const getProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.status(200).json({
      projects,
    })
  } catch (error) {
    next(error)
  }
}

// GET /api/projects/:id - Get single project by ID with its tasks
export const getProjectById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        tasks: {
          include: { tags: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
    })

    if (!project) {
      res.status(404).json({
        error: 'Project not found',
      })
      return
    }

    res.status(200).json({
      project,
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/projects - Create a new project
export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { title, description, color } = req.body as CreateProjectInput

    const project = await prisma.project.create({
      data: {
        title,
        description,
        color: color || '#6366f1',
        userId,
      },
    })

    res.status(201).json({
      message: 'Project created successfully',
      project,
    })
  } catch (error) {
    next(error)
  }
}

// PUT /api/projects/:id - Update an existing project
export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const data = req.body as UpdateProjectInput

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      res.status(404).json({
        error: 'Project not found',
      })
      return
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    })

    res.status(200).json({
      message: 'Project updated successfully',
      project: updated,
    })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/projects/:id - Delete a project
export const deleteProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      res.status(404).json({
        error: 'Project not found',
      })
      return
    }

    await prisma.project.delete({
      where: { id },
    })

    res.status(200).json({
      message: 'Project deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}
