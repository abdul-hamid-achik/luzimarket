import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Luzi Market API',
            version: '1.0.0',
            description: 'API documentation for Luzi Market e-commerce platform',
            contact: {
                name: 'API Support',
                email: 'support@luzimarket.com',
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://api.luzimarket.com'
                    : 'http://localhost:8000',
                description: process.env.NODE_ENV === 'production'
                    ? 'Production server'
                    : 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                },
            },
            schemas: {
                BestSellerProduct: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Product ID' },
                        slug: { type: 'string', description: 'Product slug for URLs' },
                        name: { type: 'string', description: 'Product name' },
                        description: { type: 'string', description: 'Product description' },
                        price: { type: 'number', format: 'float', description: 'Product price' },
                        categoryId: { type: 'string', description: 'Category ID' },
                        categoryName: { type: 'string', description: 'Category name' },
                        categorySlug: { type: 'string', description: 'Category slug' },
                        imageUrl: { type: 'string', description: 'Product image URL' },
                        imageAlt: { type: 'string', description: 'Image alt text' },
                        totalSold: { type: 'integer', description: 'Total units sold' },
                    },
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' },
                        uptime: { type: 'integer', description: 'Server uptime in seconds' },
                        environment: { type: 'string', example: 'development' },
                        memory: {
                            type: 'object',
                            properties: {
                                free: { type: 'integer', description: 'Free memory in MB' },
                                total: { type: 'integer', description: 'Total memory in MB' },
                                usage: { type: 'integer', description: 'Used memory in MB' },
                            },
                        },
                        cpu: {
                            type: 'array',
                            items: { type: 'number' },
                            description: 'CPU load averages',
                        },
                        logs: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    exists: { type: 'boolean' },
                                    size: { type: 'integer' },
                                    modified: { type: 'string', format: 'date-time' },
                                    entries: { type: 'integer' },
                                },
                            },
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', description: 'Error message' },
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', description: 'Detailed error message' },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Products',
                description: 'Product management endpoints',
            },
            {
                name: 'Health',
                description: 'Health check and monitoring endpoints',
            },
            {
                name: 'Authentication',
                description: 'Authentication and authorization endpoints',
            },
            {
                name: 'Orders',
                description: 'Order management endpoints',
            },
            {
                name: 'Cart',
                description: 'Shopping cart endpoints',
            },
            {
                name: 'Admin',
                description: 'Administrative endpoints',
            },
            {
                name: 'Debug',
                description: 'Debug and development endpoints',
            },
            {
                name: 'Documentation',
                description: 'API documentation endpoints',
            },
        ],
    },
    apis: [
        './src/app/api/**/*.ts', // Path to the API docs
    ],
};

export const specs = swaggerJsdoc(options); 