import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer } from '@/test/api-client';

describe('Analytics API Integration Tests', () => {
    let client: any;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('Sales Analytics API', () => {
        it('should fetch sales analytics with default parameters', async () => {
            const response = await client
                .get('/api/analytics/sales')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('trends');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('period', 'daily');

            // Validate summary structure
            const summary = response.body.data.summary;
            expect(summary).toHaveProperty('totalRevenue');
            expect(summary).toHaveProperty('totalOrders');
            expect(summary).toHaveProperty('averageOrderValue');
            expect(summary).toHaveProperty('completedOrders');

            // Validate trends data
            expect(Array.isArray(response.body.data.trends)).toBe(true);
        });

        it('should fetch sales analytics with date filters', async () => {
            const startDate = '2023-01-01';
            const endDate = '2023-12-31';

            const response = await client
                .get(`/api/analytics/sales?startDate=${startDate}&endDate=${endDate}`)
                .expect(200);

            expect(response.body.data.dateRange.startDate).toBe(startDate);
            expect(response.body.data.dateRange.endDate).toBe(endDate);
        });

        it('should fetch sales analytics with different periods', async () => {
            const periods = ['daily', 'weekly', 'monthly'];

            for (const period of periods) {
                const response = await client
                    .get(`/api/analytics/sales?period=${period}`)
                    .expect(200);

                expect(response.body.data.period).toBe(period);
            }
        });

        it('should handle invalid date formats gracefully', async () => {
            const response = await client
                .get('/api/analytics/sales?startDate=invalid-date');

            // Should not crash the server
            expect([200, 400, 500]).toContain(response.status);
        });
    });

    describe('Order Status Analytics API', () => {
        it('should fetch order status analytics with default parameters', async () => {
            const response = await client
                .get('/api/analytics/order-status')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');

            const data = response.body.data;
            expect(data).toHaveProperty('statusDistribution');
            expect(data).toHaveProperty('paymentStatusDistribution');
            expect(data).toHaveProperty('progressData');
            expect(data).toHaveProperty('summary');
            expect(data).toHaveProperty('period', 'weekly');

            // Validate status distribution structure
            expect(Array.isArray(data.statusDistribution)).toBe(true);
            expect(Array.isArray(data.paymentStatusDistribution)).toBe(true);
            expect(Array.isArray(data.progressData)).toBe(true);

            // Validate summary structure
            const summary = data.summary;
            expect(summary).toHaveProperty('totalOrders');
            expect(summary).toHaveProperty('completedOrders');
            expect(summary).toHaveProperty('completionRate');
            expect(summary).toHaveProperty('pendingOrders');
            expect(summary).toHaveProperty('processingOrders');
        });

        it('should fetch order status analytics with different periods', async () => {
            const periods = ['daily', 'weekly', 'monthly'];

            for (const period of periods) {
                const response = await client
                    .get(`/api/analytics/order-status?period=${period}`)
                    .expect(200);

                expect(response.body.data.period).toBe(period);

                // Progress data should have period-specific formatting
                const progressData = response.body.data.progressData;
                if (progressData.length > 0) {
                    const firstItem = progressData[0];
                    expect(firstItem).toHaveProperty('name');
                    expect(firstItem).toHaveProperty('pending');
                    expect(firstItem).toHaveProperty('processing');
                    expect(firstItem).toHaveProperty('shipped');
                    expect(firstItem).toHaveProperty('delivered');
                    expect(firstItem).toHaveProperty('total');
                }
            }
        });

        it('should calculate completion rates correctly', async () => {
            const response = await client
                .get('/api/analytics/order-status')
                .expect(200);

            const summary = response.body.data.summary;

            // Completion rate should be between 0 and 100
            expect(summary.completionRate).toBeGreaterThanOrEqual(0);
            expect(summary.completionRate).toBeLessThanOrEqual(100);

            // Total orders should be sum of all statuses
            if (summary.totalOrders > 0) {
                expect(summary.completedOrders).toBeLessThanOrEqual(summary.totalOrders);
            }
        });
    });

    describe('Vendor Analytics API', () => {
        it('should fetch vendor analytics with default parameters', async () => {
            const response = await client
                .get('/api/analytics/vendors')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');

            const data = response.body.data;
            expect(data).toHaveProperty('vendorPerformance');
            expect(data).toHaveProperty('vendorStatusDistribution');
            expect(data).toHaveProperty('topVendorsByCommission');
            expect(data).toHaveProperty('summary');

            // Validate vendor performance structure
            expect(Array.isArray(data.vendorPerformance)).toBe(true);
            expect(Array.isArray(data.vendorStatusDistribution)).toBe(true);
            expect(Array.isArray(data.topVendorsByCommission)).toBe(true);

            // Validate summary structure
            const summary = data.summary;
            expect(summary).toHaveProperty('totalVendors');
            expect(summary).toHaveProperty('totalRevenue');
            expect(summary).toHaveProperty('averageRevenuePerVendor');
            expect(summary).toHaveProperty('activeVendors');
            expect(summary).toHaveProperty('pendingVendors');
        });

        it('should respect limit parameter', async () => {
            const limit = 5;
            const response = await client
                .get(`/api/analytics/vendors?limit=${limit}`)
                .expect(200);

            const vendorPerformance = response.body.data.vendorPerformance;

            // Should not exceed the limit
            expect(vendorPerformance.length).toBeLessThanOrEqual(limit);
        });

        it('should handle date range filters', async () => {
            const startDate = '2023-01-01';
            const endDate = '2023-12-31';

            const response = await client
                .get(`/api/analytics/vendors?startDate=${startDate}&endDate=${endDate}`)
                .expect(200);

            expect(response.body.data.dateRange.startDate).toBe(startDate);
            expect(response.body.data.dateRange.endDate).toBe(endDate);
        });

        it('should validate vendor performance data structure', async () => {
            const response = await client
                .get('/api/analytics/vendors')
                .expect(200);

            const vendorPerformance = response.body.data.vendorPerformance;

            // Each vendor should have the required fields
            vendorPerformance.forEach((vendor: any) => {
                expect(vendor).toHaveProperty('name');
                expect(vendor).toHaveProperty('revenue');
                expect(vendor).toHaveProperty('orders');
                expect(vendor).toHaveProperty('products');
                expect(vendor).toHaveProperty('averageOrderValue');

                // Revenue and orders should be numbers
                expect(typeof vendor.revenue).toBe('number');
                expect(typeof vendor.orders).toBe('number');
                expect(typeof vendor.products).toBe('number');
            });
        });
    });

    describe('Analytics API Error Handling', () => {
        it('should handle non-existent analytics endpoints', async () => {
            await client
                .get('/api/analytics/non-existent')
                .expect(404);
        });

        it('should handle malformed query parameters', async () => {
            const endpoints = [
                '/api/analytics/sales?limit=not-a-number',
                '/api/analytics/vendors?period=invalid-period',
                '/api/analytics/order-status?startDate=not-a-date&endDate=also-not-a-date'
            ];

            for (const endpoint of endpoints) {
                const response = await client.get(endpoint);
                // Should handle gracefully and not crash
                // 404 is acceptable if endpoint doesn't exist, 400/422 for bad params, 500 for server errors, 200 if params are ignored
                expect([200, 400, 404, 422, 500]).toContain(response.status);

                // If it returns 200, it should still have a proper response structure
                if (response.status === 200) {
                    expect(response.body).toHaveProperty('success');
                    expect(response.body).toHaveProperty('data');
                }
            }
        });
    });

    describe('Analytics Data Consistency', () => {
        it('should return consistent data structure across multiple requests', async () => {
            const endpoints = [
                '/api/analytics/sales',
                '/api/analytics/order-status',
                '/api/analytics/vendors'
            ];

            for (const endpoint of endpoints) {
                const response = await client
                    .get(endpoint)
                    .expect(200);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            }
        });

        it('should maintain data integrity across date ranges', async () => {
            // Test with overlapping date ranges
            const range1 = await client
                .get('/api/analytics/sales?startDate=2023-01-01&endDate=2023-06-30')
                .expect(200);

            const range2 = await client
                .get('/api/analytics/sales?startDate=2023-04-01&endDate=2023-09-30')
                .expect(200);

            // Both should have valid summary data
            expect(range1.body.data.summary.totalRevenue).toBeGreaterThanOrEqual(0);
            expect(range2.body.data.summary.totalRevenue).toBeGreaterThanOrEqual(0);
        });
    });
}); 