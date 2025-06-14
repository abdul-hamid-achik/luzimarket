import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer } from '@/test/api-client';

describe('Products Analytics API Integration Tests', () => {
    let client: any;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('GET /api/analytics/products', () => {
        it('should fetch product analytics successfully', async () => {
            const response = await client
                .get('/api/analytics/products')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            
            // Validate product counts
            expect(response.body).toHaveProperty('totalProducts');
            expect(response.body).toHaveProperty('activeProducts');
            expect(response.body).toHaveProperty('draftProducts');
            expect(response.body).toHaveProperty('inactiveProducts');
            expect(response.body).toHaveProperty('outOfStockProducts');
            
            // Validate counts are numbers
            expect(typeof response.body.totalProducts).toBe('number');
            expect(typeof response.body.activeProducts).toBe('number');
            expect(typeof response.body.draftProducts).toBe('number');
            expect(typeof response.body.inactiveProducts).toBe('number');
            expect(typeof response.body.outOfStockProducts).toBe('number');
        });

        it('should include inventory status data', async () => {
            const response = await client
                .get('/api/analytics/products')
                .expect(200);

            expect(response.body).toHaveProperty('inventoryStatus');
            const inventoryStatus = response.body.inventoryStatus;
            
            expect(inventoryStatus).toHaveProperty('totalVariants');
            expect(inventoryStatus).toHaveProperty('lowStockVariants');
            expect(inventoryStatus).toHaveProperty('outOfStockVariants');
            expect(inventoryStatus).toHaveProperty('totalStock');
            
            // Validate inventory values are numbers
            expect(typeof inventoryStatus.totalVariants).toBe('number');
            expect(typeof inventoryStatus.lowStockVariants).toBe('number');
            expect(typeof inventoryStatus.outOfStockVariants).toBe('number');
            expect(typeof inventoryStatus.totalStock).toBe('number');
        });

        it('should include top selling products', async () => {
            const response = await client
                .get('/api/analytics/products')
                .expect(200);

            expect(response.body).toHaveProperty('topSellingProducts');
            expect(Array.isArray(response.body.topSellingProducts)).toBe(true);
            
            // If there are top selling products, validate their structure
            if (response.body.topSellingProducts.length > 0) {
                const firstProduct = response.body.topSellingProducts[0];
                expect(firstProduct).toHaveProperty('id');
                expect(firstProduct).toHaveProperty('name');
                expect(firstProduct).toHaveProperty('price');
                expect(firstProduct).toHaveProperty('soldCount');
                expect(firstProduct).toHaveProperty('revenue');
                
                // Validate types
                expect(typeof firstProduct.id).toBe('string');
                expect(typeof firstProduct.name).toBe('string');
                expect(typeof firstProduct.price).toBe('number');
                expect(typeof firstProduct.soldCount).toBe('number');
                expect(typeof firstProduct.revenue).toBe('number');
            }
        });

        it('should include category distribution', async () => {
            const response = await client
                .get('/api/analytics/products')
                .expect(200);

            expect(response.body).toHaveProperty('categoryDistribution');
            expect(Array.isArray(response.body.categoryDistribution)).toBe(true);
            
            // If there are categories, validate their structure
            if (response.body.categoryDistribution.length > 0) {
                const firstCategory = response.body.categoryDistribution[0];
                expect(firstCategory).toHaveProperty('categoryId');
                expect(firstCategory).toHaveProperty('categoryName');
                expect(firstCategory).toHaveProperty('productCount');
                
                // Validate types
                expect(typeof firstCategory.categoryId).toBe('string');
                expect(typeof firstCategory.categoryName).toBe('string');
                expect(typeof firstCategory.productCount).toBe('number');
            }
        });

        it('should handle errors gracefully', async () => {
            // This test would require mocking a database error
            // For now, we just verify the endpoint exists and returns the expected format
            const response = await client
                .get('/api/analytics/products')
                .expect(200);

            expect(response.body).toHaveProperty('success');
        });
    });
});