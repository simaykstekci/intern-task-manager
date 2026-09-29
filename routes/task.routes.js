import { Router } from 'express';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, getTags, } from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator.js';
export const taskRouter = Router();
// All task operations require user authentication
taskRouter.use(requireAuth);
// Global tag listing
taskRouter.get('/tags', getTags);
// Task CRUD endpoints
taskRouter.get('/', getTasks);
taskRouter.get('/:id', getTaskById);
taskRouter.post('/', validateRequest(createTaskSchema), createTask);
taskRouter.put('/:id', validateRequest(updateTaskSchema), updateTask);
taskRouter.delete('/:id', deleteTask);
