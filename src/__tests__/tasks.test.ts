import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { prisma } from '../db/prisma.js'

describe('Tasks & Projects API (/api/tasks, /api/projects)', () => {
  let userAToken = ''
  let userBToken = ''
  let userAId = ''
  let testProjectId = ''
  let testTaskId = ''

  const userA = {
    email: `usera_${Date.now()}@example.com`,
    password: 'Password123!',
    fullName: 'Alice Intern',
  }

  const userB = {
    email: `userb_${Date.now()}@example.com`,
    password: 'Password123!',
    fullName: 'Bob Intern',
  }

  beforeAll(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send(userA)
    userAToken = resA.body.token
    userAId = resA.body.user.id

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(userB)
    userBToken = resB.body.token
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { in: [userA.email, userB.email] },
      },
    })
    await prisma.$disconnect()
  })

  describe('Project Endpoints (/api/projects)', () => {
    it('should create a project successfully for authenticated user', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Onboarding & Training',
          description: 'Initial weeks tasks and orientations',
          color: '#6366f1',
        })

      expect(res.status).toBe(201)
      expect(res.body.project).toHaveProperty('id')
      expect(res.body.project.title).toBe('Onboarding & Training')
      expect(res.body.project.userId).toBe(userAId)

      testProjectId = res.body.project.id
    })

    it('should list all projects belonging to user with task count', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.projects).toBeInstanceOf(Array)
      expect(res.body.projects.length).toBeGreaterThanOrEqual(1)
      expect(res.body.projects[0]).toHaveProperty('_count')
    })

    it('should not allow User B to view User A project', async () => {
      const res = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${userBToken}`)

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Project not found')
    })

    it('should update project successfully', async () => {
      const res = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Onboarding (Updated)',
        })

      expect(res.status).toBe(200)
      expect(res.body.project.title).toBe('Onboarding (Updated)')
    })
  })

  describe('Task Endpoints (/api/tasks)', () => {
    it('should reject creating task without authentication', async () => {
      const res = await request(app).post('/api/tasks').send({
        title: 'Unauthorized Task',
      })

      expect(res.status).toBe(401)
    })

    it('should reject creating task with empty title (Zod validation)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: '',
        })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Validation failed')
    })

    it('should create a new task with project, tags, priority, and status', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Setup Dev Environment',
          description: 'Install Node, Git, and clone repository',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          projectId: testProjectId,
          tags: ['setup', 'tools'],
        })

      expect(res.status).toBe(201)
      expect(res.body.task).toHaveProperty('id')
      expect(res.body.task.title).toBe('Setup Dev Environment')
      expect(res.body.task.priority).toBe('HIGH')
      expect(res.body.task.project).toHaveProperty('title')
      expect(res.body.task.tags.length).toBe(2)

      testTaskId = res.body.task.id
    })

    it('should list tasks with search and filtering', async () => {
      // 1. Fetch all tasks
      const allRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(allRes.status).toBe(200)
      expect(allRes.body.tasks.length).toBeGreaterThanOrEqual(1)

      // 2. Filter by status
      const statusRes = await request(app)
        .get('/api/tasks?status=TODO')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(statusRes.status).toBe(200)
      expect(statusRes.body.tasks.every((t: any) => t.status === 'TODO')).toBe(true)

      // 3. Search query
      const searchRes = await request(app)
        .get('/api/tasks?search=Environment')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(searchRes.status).toBe(200)
      expect(searchRes.body.tasks.length).toBeGreaterThanOrEqual(1)
      expect(searchRes.body.tasks[0].title).toContain('Environment')

      // 4. Search query non-matching
      const emptyRes = await request(app)
        .get('/api/tasks?search=NonExistentKeywordXYZ')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(emptyRes.status).toBe(200)
      expect(emptyRes.body.tasks.length).toBe(0)
    })

    it('should update task status and details', async () => {
      const res = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          status: 'IN_PROGRESS',
          priority: 'URGENT',
        })

      expect(res.status).toBe(200)
      expect(res.body.task.status).toBe('IN_PROGRESS')
      expect(res.body.task.priority).toBe('URGENT')
    })

    it('should guarantee multi-tenancy: User B cannot access User A task', async () => {
      // Bob tries to GET Alice's task
      const getRes = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)

      expect(getRes.status).toBe(404)

      // Bob tries to UPDATE Alice's task
      const putRes = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ status: 'DONE' })

      expect(putRes.status).toBe(404)

      // Bob tries to DELETE Alice's task
      const delRes = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)

      expect(delRes.status).toBe(404)
    })

    it('should delete task successfully by its owner', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message', 'Task deleted successfully')

      // Verify deletion
      const verifyRes = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)

      expect(verifyRes.status).toBe(404)
    })

    it('should list all tags via /api/tasks/tags', async () => {
      const res = await request(app)
        .get('/api/tasks/tags')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.tags).toBeInstanceOf(Array)
    })
  })
})
