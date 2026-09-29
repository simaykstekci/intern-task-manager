import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
describe('GET /api/health', () => {
    it('should return 200 OK and health status object', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('version', '1.0.0');
    });
    it('should return 404 for unknown api routes', async () => {
        const response = await request(app).get('/api/unknown-endpoint');
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Route not found');
    });
});
