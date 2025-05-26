import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer } from '../../../test/api-client';

describe('Health API Tests', () => {
    let client: any;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('GET /api/health', () => {
        it('should return system health information', async () => {
            const response = await client
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('environment');
            expect(response.body).toHaveProperty('memory');
            expect(response.body).toHaveProperty('cpu');
            expect(response.body).toHaveProperty('logs');
            expect(response.body).toHaveProperty('test', true);

            // Validate timestamp format
            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.getTime()).toBeGreaterThan(0);

            // Validate memory information
            expect(response.body.memory).toHaveProperty('free');
            expect(response.body.memory).toHaveProperty('total');
            expect(response.body.memory).toHaveProperty('usage');
            expect(typeof response.body.memory.free).toBe('number');
            expect(typeof response.body.memory.total).toBe('number');
            expect(typeof response.body.memory.usage).toBe('number');

            // Validate CPU information
            expect(Array.isArray(response.body.cpu)).toBe(true);
            expect(response.body.cpu.length).toBe(3); // Load averages for 1, 5, 15 minutes

            // Validate uptime
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });

        it('should include log file information', async () => {
            const response = await client
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('logs');
            expect(typeof response.body.logs).toBe('object');

            const expectedLogTypes = ['api-requests', 'api-errors', 'api-events', 'console-errors'];
            expectedLogTypes.forEach(logType => {
                expect(response.body.logs).toHaveProperty(logType);
                expect(response.body.logs[logType]).toHaveProperty('exists');
                expect(typeof response.body.logs[logType].exists).toBe('boolean');
            });
        });

        it('should count error entries in error logs', async () => {
            const response = await client
                .get('/api/health')
                .expect(200);

            const errorLogTypes = ['api-errors', 'console-errors'];
            errorLogTypes.forEach(logType => {
                const logInfo = response.body.logs[logType];
                if (logInfo.exists) {
                    expect(logInfo).toHaveProperty('entries');
                    expect(typeof logInfo.entries).toBe('number');
                    expect(logInfo.entries).toBeGreaterThanOrEqual(0);
                }
            });
        });

        it('should handle concurrent health check requests', async () => {
            const promises: any[] = [];
            const concurrentRequests = 5;

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(client.get('/api/health'));
            }

            const results = await Promise.all(promises);

            // All requests should succeed
            results.forEach((result: any) => {
                expect(result.status).toBe(200);
                expect(result.body.status).toBe('ok');
            });
        });

        it('should respond quickly to health checks', async () => {
            const startTime = Date.now();
            const response = await client
                .get('/api/health')
                .expect(200);
            const endTime = Date.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
            console.log(`Health check took ${responseTime}ms`);
        });

        it('should return valid JSON structure', async () => {
            const response = await client
                .get('/api/health')
                .expect(200);

            // Ensure all required fields are present
            const requiredFields = ['status', 'timestamp', 'uptime', 'environment', 'memory', 'cpu', 'logs', 'test'];
            requiredFields.forEach(field => {
                expect(response.body).toHaveProperty(field);
            });

            // Ensure memory has all required subfields
            const memoryFields = ['free', 'total', 'usage'];
            memoryFields.forEach(field => {
                expect(response.body.memory).toHaveProperty(field);
            });
        });
    });

    describe('HEAD /api/health', () => {
        it('should return 200 for availability check', async () => {
            const response = await client
                .head('/api/health')
                .expect(200);

            // HEAD should not return body content
            expect(response.text === '' || response.text === undefined).toBe(true);
        });

        it('should respond quickly to HEAD requests', async () => {
            const startTime = Date.now();
            await client
                .head('/api/health')
                .expect(200);
            const endTime = Date.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(500); // HEAD should be even faster
            console.log(`Health HEAD request took ${responseTime}ms`);
        });

        it('should handle concurrent HEAD requests', async () => {
            const promises: any[] = [];
            const concurrentRequests = 10;

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(client.head('/api/health'));
            }

            const results = await Promise.all(promises);

            // All requests should succeed
            results.forEach((result: any) => {
                expect(result.status).toBe(200);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle file system errors gracefully', async () => {
            // Even if there are file system issues, health check should still return basic info
            const response = await client
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('memory');
            expect(response.body).toHaveProperty('cpu');
        });
    });

    describe('Environment-specific behavior', () => {
        it('should set correct test environment', async () => {
            const response = await client
                .get('/api/health')
                .expect(200);

            expect(response.body.environment).toBe('test');
            expect(response.body.test).toBe(true);
        });
    });
}); 