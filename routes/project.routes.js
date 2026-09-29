import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, } from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
export const projectRouter = Router();
// All project routes require authentication
projectRouter.use(requireAuth);
projectRouter.get('/', getProjects);
projectRouter.get('/:id', getProjectById);
projectRouter.post('/', validateRequest(createProjectSchema), createProject);
projectRouter.put('/:id', validateRequest(updateProjectSchema), updateProject);
projectRouter.delete('/:id', deleteProject);
