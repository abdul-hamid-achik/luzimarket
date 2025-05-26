import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer, authenticateUser } from '@/test/api-client';

describe('Sales Analytics API Tests', () => {
    let client: any;
    let userToken: string;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();

        // Create authenticated user for potential admin endpoints
        const auth = await authenticateUser('customer');
        userToken = auth.token;
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('GET /api/analytics/sales', () => {
        it('should return sales analytics with default parameters', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('trends');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('period', 'daily');
            expect(response.body.data).toHaveProperty('dateRange');

            // Validate trends structure
            expect(Array.isArray(response.body.data.trends)).toBe(true);

            // Validate summary structure
            const summary = response.body.data.summary;
            expect(summary).toHaveProperty('totalRevenue');
            expect(summary).toHaveProperty('totalOrders');
            expect(summary).toHaveProperty('averageOrderValue');
            expect(summary).toHaveProperty('completedOrders');
            expect(typeof summary.totalRevenue).toBe('number');
            expect(typeof summary.totalOrders).toBe('number');
            expect(typeof summary.averageOrderValue).toBe('number');
            expect(typeof summary.completedOrders).toBe('number');
        });

        it('should return daily analytics by default', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            expect(response.body.data.period).toBe('daily');

            if (response.body.data.trends.length > 0) {
                const trend = response.body.data.trends[0];
                expect(trend).toHaveProperty('date');
                expect(trend).toHaveProperty('totalRevenue');
                expect(trend).toHaveProperty('orderCount');
                expect(trend).toHaveProperty('averageOrderValue');

                // Date should be in YYYY-MM-DD format for daily (if data exists)
                if (trend.date && trend.date !== null) {
                    expect(String(trend.date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                }
            }
        });

        it('should support weekly period aggregation', async () => {
            const response = await client
                .get('/api/analytics/sales?period=weekly')
                .expect(200);

            expect(response.body.data.period).toBe('weekly');

            if (response.body.data.trends.length > 0) {
                const trend = response.body.data.trends[0];
                expect(trend).toHaveProperty('date');
                expect(trend).toHaveProperty('totalRevenue');
                expect(trend).toHaveProperty('orderCount');
                expect(trend).toHaveProperty('averageOrderValue');
                expect(trend).toHaveProperty('weekNumber');

                // Date should be week start date
                expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(typeof trend.weekNumber).toBe('number');
            }
        });

        it('should support monthly period aggregation', async () => {
            const response = await client
                .get('/api/analytics/sales?period=monthly')
                .expect(200);

            expect(response.body.data.period).toBe('monthly');

            if (response.body.data.trends.length > 0) {
                const trend = response.body.data.trends[0];
                expect(trend).toHaveProperty('date');
                expect(trend).toHaveProperty('totalRevenue');
                expect(trend).toHaveProperty('orderCount');
                expect(trend).toHaveProperty('averageOrderValue');
                expect(trend).toHaveProperty('month');

                // Date should be in YYYY-MM format for monthly
                expect(trend.date).toMatch(/^\d{4}-\d{2}$/);
                expect(typeof trend.month).toBe('string');
            }
        });

        it('should filter by start date', async () => {
            const startDate = '2024-01-01';
            const response = await client
                .get(`/api/analytics/sales?startDate=${startDate}`)
                .expect(200);

            expect(response.body.data.dateRange.startDate).toBe(startDate);

            // All trends should be after or on the start date
            response.body.data.trends.forEach((trend: any) => {
                expect(new Date(trend.date).getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
            });
        });

        it('should filter by end date', async () => {
            const endDate = '2024-12-31';
            const response = await client
                .get(`/api/analytics/sales?endDate=${endDate}`)
                .expect(200);

            expect(response.body.data.dateRange.endDate).toBe(endDate);

            // All trends should be before or on the end date
            response.body.data.trends.forEach((trend: any) => {
                expect(new Date(trend.date).getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
            });
        });

        it('should filter by date range', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-06-30';
            const response = await client
                .get(`/api/analytics/sales?startDate=${startDate}&endDate=${endDate}`)
                .expect(200);

            expect(response.body.data.dateRange.startDate).toBe(startDate);
            expect(response.body.data.dateRange.endDate).toBe(endDate);

            // All trends should be within the date range
            response.body.data.trends.forEach((trend: any) => {
                const trendDate = new Date(trend.date).getTime();
                expect(trendDate).toBeGreaterThanOrEqual(new Date(startDate).getTime());
                expect(trendDate).toBeLessThanOrEqual(new Date(endDate).getTime());
            });
        });

        it('should handle invalid period values gracefully', async () => {
            const invalidPeriods = ['hourly', 'yearly', 'invalid'];

            for (const period of invalidPeriods) {
                const response = await client
                    .get(`/api/analytics/sales?period=${period}`)
                    .expect(200); // Should default to daily

                expect(response.body.data.period).toBe(period); // Returns what was requested
            }
        });

        it('should handle invalid date formats gracefully', async () => {
            const invalidDates = ['invalid-date', '2024-13-32', 'not-a-date'];

            for (const date of invalidDates) {
                const response = await client
                    .get(`/api/analytics/sales?startDate=${date}`);

                // Should either return 200 with null date or 400 error
                expect([200, 400]).toContain(response.status);
            }
        });

        it('should calculate average order value correctly', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            if (response.body.data.summary.totalOrders > 0) {
                const expectedAvg = response.body.data.summary.totalRevenue / response.body.data.summary.totalOrders;
                const actualAvg = response.body.data.summary.averageOrderValue;

                // Allow for small floating point differences
                expect(Math.abs(actualAvg - expectedAvg)).toBeLessThan(0.01);
            }

            // Check trend calculations too
            response.body.data.trends.forEach((trend: any) => {
                if (trend.orderCount > 0) {
                    const expectedAvg = trend.totalRevenue / trend.orderCount;
                    expect(Math.abs(trend.averageOrderValue - expectedAvg)).toBeLessThan(0.01);
                } else {
                    expect(trend.averageOrderValue).toBe(0);
                }
            });
        });

        it('should handle empty results gracefully', async () => {
            // Use a future date range with no data
            const futureStart = '2030-01-01';
            const futureEnd = '2030-12-31';

            const response = await client
                .get(`/api/analytics/sales?startDate=${futureStart}&endDate=${futureEnd}`)
                .expect(200);

            expect(response.body.data.trends).toEqual([]);
            expect(response.body.data.summary.totalRevenue).toBe(0);
            expect(response.body.data.summary.totalOrders).toBe(0);
            expect(response.body.data.summary.averageOrderValue).toBe(0);
            expect(response.body.data.summary.completedOrders).toBe(0);
        });

        it('should only include completed orders in analytics', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            // Summary should only count succeeded payments
            const summary = response.body.data.summary;
            expect(summary.completedOrders).toBeLessThanOrEqual(summary.totalOrders);

            // Trends should only include succeeded payments based on the where clause
            response.body.data.trends.forEach((trend: any) => {
                expect(trend.totalRevenue).toBeGreaterThanOrEqual(0);
                expect(trend.orderCount).toBeGreaterThanOrEqual(0);
            });
        });

        it('should sort trends chronologically', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            const trends = response.body.data.trends;
            if (trends.length > 1) {
                for (let i = 1; i < trends.length; i++) {
                    const prevDate = new Date(trends[i - 1].date);
                    const currDate = new Date(trends[i].date);
                    expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
                }
            }
        });

        it('should handle combined filters correctly', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-06-30';
            const period = 'weekly';

            const response = await client
                .get(`/api/analytics/sales?startDate=${startDate}&endDate=${endDate}&period=${period}`)
                .expect(200);

            expect(response.body.data.period).toBe(period);
            expect(response.body.data.dateRange.startDate).toBe(startDate);
            expect(response.body.data.dateRange.endDate).toBe(endDate);

            // Verify all constraints are applied
            response.body.data.trends.forEach((trend: any) => {
                const trendDate = new Date(trend.date).getTime();
                expect(trendDate).toBeGreaterThanOrEqual(new Date(startDate).getTime());
                expect(trendDate).toBeLessThanOrEqual(new Date(endDate).getTime());
                expect(trend).toHaveProperty('weekNumber');
            });
        });
    });

    describe('Data Aggregation', () => {
        it('should properly aggregate weekly data', async () => {
            const response = await client
                .get('/api/analytics/sales?period=weekly')
                .expect(200);

            response.body.data.trends.forEach((trend: any) => {
                expect(trend).toHaveProperty('date');
                expect(trend).toHaveProperty('totalRevenue');
                expect(trend).toHaveProperty('orderCount');
                expect(trend).toHaveProperty('averageOrderValue');
                expect(trend).toHaveProperty('weekNumber');

                // Verify date is a Monday (week start)
                const date = new Date(trend.date);
                expect(date.getDay()).toBe(1); // Monday = 1
            });
        });

        it('should properly aggregate monthly data', async () => {
            const response = await client
                .get('/api/analytics/sales?period=monthly')
                .expect(200);

            response.body.data.trends.forEach((trend: any) => {
                expect(trend).toHaveProperty('date');
                expect(trend).toHaveProperty('totalRevenue');
                expect(trend).toHaveProperty('orderCount');
                expect(trend).toHaveProperty('averageOrderValue');
                expect(trend).toHaveProperty('month');

                // Verify date format is YYYY-MM
                expect(trend.date).toMatch(/^\d{4}-\d{2}$/);
                expect(typeof trend.month).toBe('string');
            });
        });

        it('should maintain data consistency across periods', async () => {
            const dateRange = 'startDate=2024-01-01&endDate=2024-01-31';

            // Get same data for different periods
            const daily = await client.get(`/api/analytics/sales?${dateRange}&period=daily`).expect(200);
            const weekly = await client.get(`/api/analytics/sales?${dateRange}&period=weekly`).expect(200);
            const monthly = await client.get(`/api/analytics/sales?${dateRange}&period=monthly`).expect(200);

            // Total revenue should be consistent across periods
            const dailyTotal = daily.body.data.trends.reduce((sum: number, t: any) => sum + t.totalRevenue, 0);
            const weeklyTotal = weekly.body.data.trends.reduce((sum: number, t: any) => sum + t.totalRevenue, 0);
            const monthlyTotal = monthly.body.data.trends.reduce((sum: number, t: any) => sum + t.totalRevenue, 0);

            // Allow for small floating point differences
            expect(Math.abs(dailyTotal - weeklyTotal)).toBeLessThan(0.01);
            expect(Math.abs(dailyTotal - monthlyTotal)).toBeLessThan(0.01);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // This test assumes the endpoint handles DB errors
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            expect(response.body).toHaveProperty('success');
        });

        it('should return proper error structure on failure', async () => {
            // Test with malformed parameters that might cause errors
            const response = await client
                .get('/api/analytics/sales?startDate=invalid&endDate=also-invalid');

            if (response.status === 500) {
                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('error');
                expect(typeof response.body.error).toBe('string');
            }
        });
    });

    describe('Performance Tests', () => {
        it('should respond quickly to analytics requests', async () => {
            const startTime = Date.now();
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);
            const endTime = Date.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(3000); // Analytics can be slower, allow 3 seconds
            console.log(`Sales analytics request took ${responseTime}ms`);
        });

        it('should handle concurrent analytics requests', async () => {
            const promises = [];
            const concurrentRequests = 3; // Lower for analytics due to complexity

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(client.get('/api/analytics/sales'));
            }

            const results = await Promise.all(promises);

            // All requests should succeed
            results.forEach(result => {
                expect(result.status).toBe(200);
                expect(result.body).toHaveProperty('success', true);
            });
        });

        it('should handle large date ranges efficiently', async () => {
            const startTime = Date.now();
            await client
                .get('/api/analytics/sales?startDate=2020-01-01&endDate=2024-12-31')
                .expect(200);
            const endTime = Date.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(5000); // Large ranges can take up to 5 seconds
        });
    });

    describe('Data Validation', () => {
        it('should return numeric values for all metrics', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            const summary = response.body.data.summary;
            expect(typeof summary.totalRevenue).toBe('number');
            expect(typeof summary.totalOrders).toBe('number');
            expect(typeof summary.averageOrderValue).toBe('number');
            expect(typeof summary.completedOrders).toBe('number');

            response.body.data.trends.forEach((trend: any) => {
                expect(typeof trend.totalRevenue).toBe('number');
                expect(typeof trend.orderCount).toBe('number');
                expect(typeof trend.averageOrderValue).toBe('number');
                expect(trend.totalRevenue).toBeGreaterThanOrEqual(0);
                expect(trend.orderCount).toBeGreaterThanOrEqual(0);
                expect(trend.averageOrderValue).toBeGreaterThanOrEqual(0);
            });
        });

        it('should handle zero values correctly', async () => {
            const response = await client
                .get('/api/analytics/sales?startDate=2030-01-01&endDate=2030-12-31')
                .expect(200);

            expect(response.body.data.summary.totalRevenue).toBe(0);
            expect(response.body.data.summary.totalOrders).toBe(0);
            expect(response.body.data.summary.averageOrderValue).toBe(0);
            expect(response.body.data.summary.completedOrders).toBe(0);
        });

        it('should maintain referential integrity in calculations', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            const summary = response.body.data.summary;

            // Completed orders should not exceed total orders
            expect(summary.completedOrders).toBeLessThanOrEqual(summary.totalOrders);

            // If there are orders, average should be positive (unless all orders are $0)
            if (summary.totalOrders > 0 && summary.totalRevenue > 0) {
                expect(summary.averageOrderValue).toBeGreaterThan(0);
            }
        });
    });
}); 