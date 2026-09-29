import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../db/prisma.js';
describe('Authentication API (/api/auth)', () => {
    const testUser = {
        email: `intern_${Date.now()}@example.com`,
        password: 'Password123!',
        fullName: 'Jane Doe',
    };
    let authToken = '';
    beforeAll(async () => {
        // Clean up any potential lingering test users
        await prisma.user.deleteMany({
            where: { email: { contains: 'intern_' } },
        });
    });
    afterAll(async () => {
        // Clean up test data after all tests run
        await prisma.user.deleteMany({
            where: { email: { contains: 'intern_' } },
        });
        await prisma.$disconnect();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully and return JWT token', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Account created successfully');
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.fullName).toBe(testUser.fullName);
            expect(res.body.user).not.toHaveProperty('passwordHash');
            // Save token for /me tests
            authToken = res.body.token;
        });
        it('should reject registration if email is already taken', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Email already registered. Please login instead.');
        });
        it('should reject registration if validation fails (short password)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                email: 'invalid@example.com',
                password: '123', // less than 6 chars
                fullName: 'Test User',
            });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Validation failed');
            expect(res.body.details).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    field: 'password',
                    message: 'Password must be at least 6 characters long',
                }),
            ]));
        });
    });
    describe('POST /api/auth/login', () => {
        it('should log in successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Login successful');
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user).not.toHaveProperty('passwordHash');
        });
        it('should reject login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: 'WrongPassword!',
            });
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid email or password');
        });
        it('should reject login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'Password123!',
            });
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid email or password');
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return current user profile when valid Bearer token is provided', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user.fullName).toBe(testUser.fullName);
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user).not.toHaveProperty('passwordHash');
        });
        it('should reject request when Bearer token is missing', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
        });
        it('should reject request when Bearer token is invalid or tampered', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-tampered-token');
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid or expired authentication token');
        });
    });
});
