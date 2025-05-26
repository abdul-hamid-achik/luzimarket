import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer } from '../../../test/api-client';

describe('Homepage Slides API', () => {
    let client: any;
    let createdSlideIds: string[] = [];

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();
    });

    afterAll(async () => {
        // Cleanup created slides
        for (const slideId of createdSlideIds) {
            try {
                await client.delete(`/api/homepage-slides/${slideId}`);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
        await cleanupTestServer();
    });

    describe('GET /api/homepage-slides', () => {
        it('should fetch active homepage slides', async () => {
            const response = await client
                .get('/api/homepage-slides')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            // Each slide should have required properties
            if (response.body.length > 0) {
                const slide = response.body[0];
                expect(slide).toHaveProperty('id');
                expect(slide).toHaveProperty('title');
                expect(slide).toHaveProperty('imageUrl');
                expect(slide).toHaveProperty('isActive');
                expect(slide.isActive).toBe(true);
            }
        });

        it('should fetch all slides including inactive ones', async () => {
            const response = await client
                .get('/api/homepage-slides?includeInactive=true')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/homepage-slides', () => {
        it('should create a new homepage slide with required fields only', async () => {
            const slideData = {
                title: 'API Test Slide',
                imageUrl: 'https://example.com/test-image.jpg'
            };

            const response = await client
                .post('/api/homepage-slides')
                .send(slideData)
                .expect(201);

            const createdSlide = response.body;
            expect(createdSlide).toHaveProperty('id');
            expect(createdSlide.title).toBe(slideData.title);
            expect(createdSlide.imageUrl).toBe(slideData.imageUrl);
            expect(createdSlide.isActive).toBe(true); // Default value
            expect(createdSlide.backgroundColor).toBe('#ffffff'); // Default value
            expect(createdSlide.textColor).toBe('#000000'); // Default value
            expect(createdSlide.position).toBe('center'); // Default value

            // Store for cleanup
            createdSlideIds.push(createdSlide.id);
        });

        it('should create a slide with all fields', async () => {
            const slideData = {
                title: 'Complete API Test Slide',
                subtitle: 'Test Subtitle',
                description: 'This is a comprehensive test description',
                imageUrl: 'https://example.com/complete-test.jpg',
                buttonText: 'Test Button',
                buttonLink: 'https://example.com/test',
                backgroundColor: '#ff0000',
                textColor: '#ffffff',
                position: 'left',
                isActive: false,
                sortOrder: 10
            };

            const response = await client
                .post('/api/homepage-slides')
                .send(slideData)
                .expect(201);

            const createdSlide = response.body;
            expect(createdSlide.title).toBe(slideData.title);
            expect(createdSlide.subtitle).toBe(slideData.subtitle);
            expect(createdSlide.description).toBe(slideData.description);
            expect(createdSlide.imageUrl).toBe(slideData.imageUrl);
            expect(createdSlide.buttonText).toBe(slideData.buttonText);
            expect(createdSlide.buttonLink).toBe(slideData.buttonLink);
            expect(createdSlide.backgroundColor).toBe(slideData.backgroundColor);
            expect(createdSlide.textColor).toBe(slideData.textColor);
            expect(createdSlide.position).toBe(slideData.position);
            expect(createdSlide.isActive).toBe(slideData.isActive);
            expect(createdSlide.sortOrder).toBe(slideData.sortOrder);

            createdSlideIds.push(createdSlide.id);
        });

        it('should reject slide without required title', async () => {
            const slideData = {
                imageUrl: 'https://example.com/test-image.jpg'
                // Missing title
            };

            const response = await client
                .post('/api/homepage-slides')
                .send(slideData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Title and image URL are required');
        });

        it('should reject slide without required imageUrl', async () => {
            const slideData = {
                title: 'Test Slide'
                // Missing imageUrl
            };

            const response = await client
                .post('/api/homepage-slides')
                .send(slideData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Title and image URL are required');
        });

        it('should reject slide with empty title', async () => {
            const slideData = {
                title: '', // Empty title
                imageUrl: 'https://example.com/test-image.jpg'
            };

            await client
                .post('/api/homepage-slides')
                .send(slideData)
                .expect(400);
        });
    });

    describe('PUT /api/homepage-slides/[id]', () => {
        it('should update an existing slide', async () => {
            // First create a slide to update
            const createData = {
                title: 'Original Title',
                imageUrl: 'https://example.com/original.jpg'
            };

            const createResponse = await client
                .post('/api/homepage-slides')
                .send(createData)
                .expect(201);

            const createdSlide = createResponse.body;
            createdSlideIds.push(createdSlide.id);

            // Now update it
            const updateData = {
                title: 'Updated Title',
                subtitle: 'Updated Subtitle',
                imageUrl: 'https://example.com/updated.jpg',
                isActive: false
            };

            const updateResponse = await client
                .put(`/api/homepage-slides/${createdSlide.id}`)
                .send(updateData)
                .expect(200);

            const updatedSlide = updateResponse.body;
            expect(updatedSlide.title).toBe(updateData.title);
            expect(updatedSlide.subtitle).toBe(updateData.subtitle);
            expect(updatedSlide.imageUrl).toBe(updateData.imageUrl);
            expect(updatedSlide.isActive).toBe(updateData.isActive);
        });

        it('should return 404 for non-existent slide', async () => {
            const updateData = {
                title: 'Updated Title',
                imageUrl: 'https://example.com/updated.jpg'
            };

            const response = await client
                .put('/api/homepage-slides/non-existent-id')
                .send(updateData)
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Slide not found');
        });
    });

    describe('DELETE /api/homepage-slides/[id]', () => {
        it('should delete an existing slide', async () => {
            // First create a slide to delete
            const createData = {
                title: 'To Delete',
                imageUrl: 'https://example.com/to-delete.jpg'
            };

            const createResponse = await client
                .post('/api/homepage-slides')
                .send(createData)
                .expect(201);

            const createdSlide = createResponse.body;

            // Now delete it
            const deleteResponse = await client
                .delete(`/api/homepage-slides/${createdSlide.id}`)
                .expect(200);

            expect(deleteResponse.body).toHaveProperty('message');
            expect(deleteResponse.body.message).toBe('Slide deleted successfully');

            // Verify it's deleted by trying to fetch it
            await client
                .get(`/api/homepage-slides/${createdSlide.id}`)
                .expect(404);
        });

        it('should return 404 for non-existent slide', async () => {
            const response = await client
                .delete('/api/homepage-slides/non-existent-id')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Slide not found');
        });
    });

    describe('GET /api/homepage-slides/[id]', () => {
        it('should fetch a specific slide by ID', async () => {
            // First create a slide
            const createData = {
                title: 'Specific Slide',
                imageUrl: 'https://example.com/specific.jpg'
            };

            const createResponse = await client
                .post('/api/homepage-slides')
                .send(createData)
                .expect(201);

            const createdSlide = createResponse.body;
            createdSlideIds.push(createdSlide.id);

            // Now fetch it by ID
            const fetchResponse = await client
                .get(`/api/homepage-slides/${createdSlide.id}`)
                .expect(200);

            const fetchedSlide = fetchResponse.body;
            expect(fetchedSlide.id).toBe(createdSlide.id);
            expect(fetchedSlide.title).toBe(createData.title);
            expect(fetchedSlide.imageUrl).toBe(createData.imageUrl);
        });

        it('should return 404 for non-existent slide', async () => {
            const response = await client
                .get('/api/homepage-slides/non-existent-id')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Slide not found');
        });
    });

    describe('Data Validation and Edge Cases', () => {
        it('should handle very long title', async () => {
            const longTitle = 'A'.repeat(1000);
            const slideData = {
                title: longTitle,
                imageUrl: 'https://example.com/test.jpg'
            };

            const response = await client
                .post('/api/homepage-slides')
                .send(slideData);

            // Should either accept it or return a validation error
            expect([201, 400]).toContain(response.status);

            if (response.status === 201) {
                createdSlideIds.push(response.body.id);
            }
        });

        it('should handle SQL injection attempts', async () => {
            const slideData = {
                title: "'; DROP TABLE homepage_slides; --",
                imageUrl: 'https://example.com/test.jpg'
            };

            const response = await client
                .post('/api/homepage-slides')
                .send(slideData);

            // Should either create the slide safely or reject it
            expect([201, 400]).toContain(response.status);

            if (response.status === 201) {
                createdSlideIds.push(response.body.id);
                // Verify the title was stored safely
                expect(response.body.title).toBe(slideData.title);
            }
        });
    });
}); 