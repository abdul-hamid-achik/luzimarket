import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer } from '../../../test/api-client';

describe('Categories API', () => {
    let client: any;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('GET /api/categories', () => {
        it('should fetch all categories', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            // Check category structure if categories exist
            if (response.body.length > 0) {
                const category = response.body[0];
                expect(category).toHaveProperty('id');
                expect(category).toHaveProperty('name');
                expect(category).toHaveProperty('slug');
                expect(category).toHaveProperty('description');
                expect(typeof category.name).toBe('string');
                expect(typeof category.slug).toBe('string');
                expect(typeof category.description).toBe('string');
            }
        });

        it('should return all categories (no filtering supported)', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            // Categories don't have isActive field - all categories are returned
            response.body.forEach((category: any) => {
                expect(category).toHaveProperty('id');
                expect(category).toHaveProperty('name');
                expect(category).toHaveProperty('slug');
                expect(category).toHaveProperty('description');
            });
        });

        it('should support hierarchical categories', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            response.body.forEach((category: any) => {
                // Check for parent/child relationships
                if (category.parentId) {
                    expect(typeof category.parentId).toBe('string');
                }

                if (category.children) {
                    expect(Array.isArray(category.children)).toBe(true);
                }

                if (category.level) {
                    expect(typeof category.level).toBe('number');
                    expect(category.level).toBeGreaterThanOrEqual(0);
                }
            });
        });

        it('should sort categories by display order', async () => {
            const response = await client
                .get('/api/categories?sort=order')
                .expect(200);

            if (response.body.length > 1) {
                for (let i = 1; i < response.body.length; i++) {
                    const current = response.body[i];
                    const previous = response.body[i - 1];

                    if (current.displayOrder && previous.displayOrder) {
                        expect(current.displayOrder).toBeGreaterThanOrEqual(previous.displayOrder);
                    }
                }
            }
        });
    });

    describe('GET /api/categories/[slug]', () => {
        let testCategorySlug: string;

        beforeAll(async () => {
            const response = await client.get('/api/categories').expect(200);
            if (response.body.length > 0) {
                testCategorySlug = response.body[0].slug;
            }
        });

        it('should fetch category by slug', async () => {
            if (!testCategorySlug) {
                console.log('⏭️  Skipping test - no categories available');
                return;
            }

            const response = await client
                .get(`/api/categories/${testCategorySlug}`)
                .expect(200);

            expect(response.body).toHaveProperty('slug', testCategorySlug);
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('description');

            // Should include products if implemented
            if (response.body.products) {
                expect(Array.isArray(response.body.products)).toBe(true);
            }

            // Should include subcategories if implemented
            if (response.body.subcategories) {
                expect(Array.isArray(response.body.subcategories)).toBe(true);
            }
        });

        it('should return 404 for non-existent category slug', async () => {
            const response = await client
                .get('/api/categories/non-existent-category-slug')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle special characters in slugs', async () => {
            const specialSlugs = [
                'categoria-con-acentos',
                'categoria_con_guiones',
                'categoria-123',
                'categoria-especial'
            ];

            for (const slug of specialSlugs) {
                const response = await client
                    .get(`/api/categories/${encodeURIComponent(slug)}`);

                // Should return 404 (not found) rather than error for valid format
                expect([200, 404]).toContain(response.status);
            }
        });
    });

    describe('Category Products', () => {
        let testCategorySlug: string;

        beforeAll(async () => {
            const response = await client.get('/api/categories').expect(200);
            if (response.body.length > 0) {
                testCategorySlug = response.body[0].slug;
            }
        });

        it('should fetch products in category', async () => {
            if (!testCategorySlug) return;

            const response = await client
                .get(`/api/categories/${testCategorySlug}?includeProducts=true`)
                .expect(200);

            if (response.body.products) {
                expect(Array.isArray(response.body.products)).toBe(true);

                // Check product structure
                response.body.products.forEach((product: any) => {
                    expect(product).toHaveProperty('id');
                    expect(product).toHaveProperty('name');
                    expect(product).toHaveProperty('price');
                    expect(product).toHaveProperty('isActive');
                });
            }
        });

        it('should support product pagination in categories', async () => {
            if (!testCategorySlug) return;

            const response = await client
                .get(`/api/categories/${testCategorySlug}?page=1&limit=10`)
                .expect(200);

            if (response.body.products) {
                expect(response.body.products.length).toBeLessThanOrEqual(10);
            }

            // Should include pagination metadata
            if (response.body.pagination) {
                expect(response.body.pagination).toHaveProperty('page');
                expect(response.body.pagination).toHaveProperty('limit');
                expect(response.body.pagination).toHaveProperty('total');
            }
        });

        it('should filter products by price in category', async () => {
            if (!testCategorySlug) return;

            const response = await client
                .get(`/api/categories/${testCategorySlug}?minPrice=10&maxPrice=100`)
                .expect(200);

            if (response.body.products) {
                response.body.products.forEach((product: any) => {
                    if (product.price) {
                        expect(product.price).toBeGreaterThanOrEqual(10);
                        expect(product.price).toBeLessThanOrEqual(100);
                    }
                });
            }
        });
    });

    describe('Category Hierarchy', () => {
        it('should provide category breadcrumbs', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            response.body.forEach((category: any) => {
                if (category.breadcrumbs) {
                    expect(Array.isArray(category.breadcrumbs)).toBe(true);

                    category.breadcrumbs.forEach((breadcrumb: any) => {
                        expect(breadcrumb).toHaveProperty('name');
                        expect(breadcrumb).toHaveProperty('slug');
                    });
                }

                if (category.path) {
                    expect(typeof category.path).toBe('string');
                    expect(category.path.startsWith('/')).toBe(true);
                }
            });
        });

        it('should handle parent-child relationships correctly', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            const categoriesWithParents = response.body.filter((cat: any) => cat.parentId);
            const parentIds = response.body.map((cat: any) => cat.id);

            categoriesWithParents.forEach((category: any) => {
                // Parent should exist in the categories list
                expect(parentIds.includes(category.parentId)).toBe(true);
            });
        });

        it('should provide category tree structure', async () => {
            const response = await client
                .get('/api/categories?tree=true')
                .expect(200);

            if (Array.isArray(response.body)) {
                response.body.forEach((category: any) => {
                    if (category.children) {
                        expect(Array.isArray(category.children)).toBe(true);

                        // Children should have parent reference
                        category.children.forEach((child: any) => {
                            expect(child.parentId).toBe(category.id);
                        });
                    }
                });
            }
        });
    });

    describe('Category SEO and Metadata', () => {
        it('should include SEO metadata', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            response.body.forEach((category: any) => {
                // SEO fields should be strings if they exist
                if (category.metaTitle) {
                    expect(typeof category.metaTitle).toBe('string');
                    expect(category.metaTitle.length).toBeGreaterThan(0);
                }

                if (category.metaDescription) {
                    expect(typeof category.metaDescription).toBe('string');
                    expect(category.metaDescription.length).toBeGreaterThan(0);
                }

                if (category.keywords) {
                    expect(Array.isArray(category.keywords) || typeof category.keywords === 'string').toBe(true);
                }
            });
        });

        it('should have valid slugs for SEO', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            response.body.forEach((category: any) => {
                if (category.slug) {
                    // Slug should be URL-friendly
                    expect(/^[a-z0-9-_]+$/.test(category.slug)).toBe(true);
                    expect(category.slug).not.toContain(' ');
                    expect(category.slug.startsWith('-')).toBe(false);
                    expect(category.slug.endsWith('-')).toBe(false);
                }
            });
        });
    });

    describe('Category Performance', () => {
        it('should respond quickly to category requests', async () => {
            const startTime = Date.now();

            await client
                .get('/api/categories')
                .expect(200);

            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(1000);
        });

        it('should handle concurrent category requests', async () => {
            const concurrentRequests = 5;
            const promises = [];

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(client.get('/api/categories'));
            }

            const results = await Promise.all(promises);

            results.forEach(result => {
                expect(result.status).toBe(200);
                expect(Array.isArray(result.body)).toBe(true);
            });
        });

        it('should cache category data efficiently', async () => {
            const request1 = await client.get('/api/categories').expect(200);
            const request2 = await client.get('/api/categories').expect(200);

            expect(request1.body).toEqual(request2.body);
        });
    });

    describe('Category Validation', () => {
        it('should validate category properties', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            response.body.forEach((category: any) => {
                // Required fields
                expect(category).toHaveProperty('id');
                expect(category).toHaveProperty('name');
                expect(category).toHaveProperty('slug');

                // Name should not be empty
                expect(category.name.trim().length).toBeGreaterThan(0);

                // Slug should not be empty
                expect(category.slug.trim().length).toBeGreaterThan(0);

                // Optional numeric fields should be valid
                if (category.productCount) {
                    expect(typeof category.productCount).toBe('number');
                    expect(category.productCount).toBeGreaterThanOrEqual(0);
                }

                if (category.displayOrder) {
                    expect(typeof category.displayOrder).toBe('number');
                }
            });
        });

        it('should handle edge cases in category queries', async () => {
            const edgeCases = [
                '/api/categories?active=invalid',
                '/api/categories?sort=invalid_field',
                '/api/categories?limit=-1',
                '/api/categories?page=0'
            ];

            for (const query of edgeCases) {
                const response = await client.get(query);
                expect([200, 400]).toContain(response.status);
            }
        });
    });

    describe('Category Business Rules', () => {
        it('should have at least one category', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            // E-commerce should have categories for organization
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should have active categories available', async () => {
            const response = await client
                .get('/api/categories?active=true')
                .expect(200);

            // Should have at least one active category
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should maintain category uniqueness', async () => {
            const response = await client
                .get('/api/categories')
                .expect(200);

            const slugs = response.body.map((cat: any) => cat.slug);
            const uniqueSlugs = [...new Set(slugs)];

            // All slugs should be unique
            expect(slugs.length).toBe(uniqueSlugs.length);

            const names = response.body.map((cat: any) => cat.name);
            const uniqueNames = [...new Set(names)];

            // All names should be unique (or at least mostly unique)
            expect(names.length).toBe(uniqueNames.length);
        });
    });
}); 