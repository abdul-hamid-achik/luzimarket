#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Route categories and their schemas
const ROUTE_CONFIGS = {
    '/api/categories': {
        tag: 'Categories',
        schemas: {
            Category: {
                id: 'string',
                name: 'string',
                slug: 'string',
                description: 'string'
            }
        }
    },
    '/api/products': {
        tag: 'Products',
        schemas: {
            Product: {
                id: 'string',
                name: 'string',
                description: 'string',
                price: 'number',
                slug: 'string',
                categoryId: 'string'
            }
        }
    },
    '/api/orders': {
        tag: 'Orders',
        schemas: {
            Order: {
                id: 'string',
                userId: 'string',
                status: 'string',
                total: 'number',
                createdAt: 'string'
            }
        }
    },
    '/api/cart': {
        tag: 'Cart',
        schemas: {
            CartItem: {
                id: 'string',
                productId: 'string',
                quantity: 'number',
                sessionId: 'string'
            }
        }
    },
    '/api/auth': {
        tag: 'Authentication',
        schemas: {
            AuthResponse: {
                token: 'string'
            },
            UserCredentials: {
                email: 'string',
                password: 'string'
            }
        }
    },
    '/api/admin': {
        tag: 'Admin',
        security: ['bearerAuth']
    },
    '/api/petitions': {
        tag: 'Petitions',
        schemas: {
            Petition: {
                id: 'string',
                type: 'string',
                title: 'string',
                description: 'string'
            }
        }
    }
};

function generateSchemaRef(path, method) {
    const config = Object.keys(ROUTE_CONFIGS).find(key => path.startsWith(key));
    if (!config) return 'type: object';

    const routeConfig = ROUTE_CONFIGS[config];
    const schemaName = Object.keys(routeConfig.schemas || {})[0];

    if (method === 'GET' && path.includes('{id}')) {
        return `$ref: '#/components/schemas/${schemaName}'`;
    } else if (method === 'GET') {
        return `type: array\n               items:\n                 $ref: '#/components/schemas/${schemaName}'`;
    } else if (method === 'POST' || method === 'PUT') {
        return `$ref: '#/components/schemas/${schemaName}'`;
    }

    return 'type: object';
}

function generateRequestBody(path, method) {
    if (!['POST', 'PUT', 'PATCH'].includes(method)) return '';

    const config = Object.keys(ROUTE_CONFIGS).find(key => path.startsWith(key));
    const schemaRef = config ? `$ref: '#/components/schemas/${Object.keys(ROUTE_CONFIGS[config].schemas || {})[0]}'` : 'type: object';

    return `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             ${schemaRef}`;
}

function generateSecurity(path) {
    const config = Object.keys(ROUTE_CONFIGS).find(key => path.startsWith(key));
    if (config && ROUTE_CONFIGS[config].security) {
        return `
 *     security:
 *       - ${ROUTE_CONFIGS[config].security[0]}: []`;
    }
    return '';
}

function generateDocumentation(apiPath, method, filePath) {
    const segments = apiPath.split('/').filter(Boolean);
    const resource = segments[segments.length - 1] || segments[segments.length - 2] || 'resource';
    const cleanResource = resource.replace(/[{}]/g, '');
    const isParam = resource.includes('{');

    // Determine tag
    let tag = 'General';
    const config = Object.keys(ROUTE_CONFIGS).find(key => apiPath.startsWith(key));
    if (config) {
        tag = ROUTE_CONFIGS[config].tag;
    }

    // Generate summary and description
    let summary, description;
    switch (method) {
        case 'GET':
            if (isParam) {
                summary = `Get ${cleanResource} by ID`;
                description = `Retrieve a specific ${cleanResource} by its unique identifier`;
            } else {
                summary = `Get all ${cleanResource}`;
                description = `Retrieve a list of all ${cleanResource}`;
            }
            break;
        case 'POST':
            summary = `Create ${cleanResource}`;
            description = `Create a new ${cleanResource}`;
            break;
        case 'PUT':
            summary = `Update ${cleanResource}`;
            description = `Update an existing ${cleanResource}`;
            break;
        case 'DELETE':
            summary = `Delete ${cleanResource}`;
            description = `Delete a ${cleanResource}`;
            break;
        case 'PATCH':
            summary = `Partially update ${cleanResource}`;
            description = `Partially update a ${cleanResource}`;
            break;
        default:
            summary = `${method} ${cleanResource}`;
            description = `${method} operation for ${cleanResource}`;
    }

    // Generate parameters
    let parameters = '';
    const paramMatches = apiPath.match(/{([^}]+)}/g);
    if (paramMatches) {
        parameters = `
 *     parameters:`;
        paramMatches.forEach(param => {
            const paramName = param.replace(/[{}]/g, '');
            parameters += `
 *       - in: path
 *         name: ${paramName}
 *         required: true
 *         schema:
 *           type: string
 *         description: ${paramName} identifier`;
        });
    }

    const requestBody = generateRequestBody(apiPath, method);
    const security = generateSecurity(apiPath);

    // Generate responses
    let responses;
    const schemaRef = generateSchemaRef(apiPath, method);

    switch (method) {
        case 'GET':
            responses = `
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               ${schemaRef}
 *       404:
 *         description: ${cleanResource} not found
 *       500:
 *         $ref: '#/components/schemas/Error'`;
            break;
        case 'POST':
            responses = `
 *     responses:
 *       201:
 *         description: ${cleanResource} created successfully
 *         content:
 *           application/json:
 *             schema:
 *               ${schemaRef}
 *       400:
 *         description: Bad request
 *       500:
 *         $ref: '#/components/schemas/Error'`;
            break;
        case 'PUT':
        case 'PATCH':
            responses = `
 *     responses:
 *       200:
 *         description: ${cleanResource} updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               ${schemaRef}
 *       404:
 *         description: ${cleanResource} not found
 *       400:
 *         description: Bad request
 *       500:
 *         $ref: '#/components/schemas/Error'`;
            break;
        case 'DELETE':
            responses = `
 *     responses:
 *       204:
 *         description: ${cleanResource} deleted successfully
 *       404:
 *         description: ${cleanResource} not found
 *       500:
 *         $ref: '#/components/schemas/Error'`;
            break;
        default:
            responses = `
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         $ref: '#/components/schemas/Error'`;
    }

    return `
/**
 * @swagger
 * ${apiPath}:
 *   ${method.toLowerCase()}:
 *     summary: ${summary}
 *     description: ${description}
 *     tags: [${tag}]${security}${parameters}${requestBody}${responses}
 */`;
}

// Helper functions from the first script
function convertToOpenAPIPath(filePath) {
    return filePath
        .replace(/\[([^\]]+)\]/g, '{$1}')
        .replace(/\[\.\.\.([^\]]+)\]/g, '{...}')
        .replace(/\/route$/, '')
        .replace(/\/$/, '');
}

function extractMethods(fileContent) {
    const methods = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/g;
    let match;

    while ((match = methodRegex.exec(fileContent)) !== null) {
        methods.push(match[1]);
    }

    return methods;
}

function findRouteFiles(dir) {
    const files = [];

    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (item === 'route.ts') {
                files.push(fullPath);
            }
        }
    }

    traverse(dir);
    return files;
}

function main() {
    const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
    const routeFiles = findRouteFiles(apiDir);

    console.log('🚀 LUZI MARKET API DOCUMENTATION GENERATOR');
    console.log('='.repeat(50));

    const undocumentedRoutes = [];

    for (const routeFile of routeFiles) {
        try {
            const content = fs.readFileSync(routeFile, 'utf8');
            const relativePath = path.relative(apiDir, routeFile);
            const apiPath = '/api/' + relativePath.replace('/route.ts', '');
            const openApiPath = convertToOpenAPIPath(apiPath);

            // Check if already documented
            const hasSwaggerDoc = content.includes('@swagger');

            if (!hasSwaggerDoc) {
                const methods = extractMethods(content);

                if (methods.length > 0) {
                    undocumentedRoutes.push({
                        path: openApiPath,
                        file: routeFile,
                        methods: methods
                    });
                }
            }
        } catch (error) {
            console.error(`Error processing ${routeFile}:`, error.message);
        }
    }

    console.log(`\n📊 DOCUMENTATION STATUS:`);
    console.log(`   Total API routes: ${routeFiles.length}`);
    console.log(`   Already documented: ${routeFiles.length - undocumentedRoutes.length}`);
    console.log(`   Need documentation: ${undocumentedRoutes.length}`);

    console.log('\n🛠️  DOCUMENTATION TEMPLATES FOR ALL REMAINING ROUTES:');
    console.log('=' * 60);

    // Group routes by category for better organization
    const routesByCategory = {};

    undocumentedRoutes.forEach(route => {
        const category = route.path.split('/')[2] || 'other'; // Get category from path
        if (!routesByCategory[category]) {
            routesByCategory[category] = [];
        }
        routesByCategory[category].push(route);
    });

    // Generate documentation for each category
    Object.keys(routesByCategory).sort().forEach(category => {
        console.log(`\n🏷️  CATEGORY: ${category.toUpperCase()}`);
        console.log('-'.repeat(40));

        routesByCategory[category].forEach(route => {
            console.log(`\n📁 FILE: ${route.file}`);
            console.log(`🔗 ENDPOINT: ${route.path}`);
            console.log(`📝 Add this documentation ABOVE the export function(s):\n`);

            route.methods.forEach(method => {
                const template = generateDocumentation(route.path, method, route.file);
                console.log(template);
            });

            console.log('\n' + '='.repeat(80));
        });
    });

    console.log(`\n\n📋 QUICK CHECKLIST:`);
    console.log(`   ✅ Copy the documentation above each export function`);
    console.log(`   ✅ Customize descriptions to match your business logic`);
    console.log(`   ✅ Add proper schema definitions for request/response bodies`);
    console.log(`   ✅ Test your endpoints at http://localhost:8000/api/docs`);
    console.log(`   ✅ Update the documentation when you change endpoint behavior`);

    console.log(`\n🎯 PRIORITY ROUTES TO DOCUMENT FIRST:`);
    const priorityRoutes = [
        '/api/products',
        '/api/categories',
        '/api/orders',
        '/api/cart',
        '/api/auth/login',
        '/api/auth/register'
    ];

    priorityRoutes.forEach(priorityPath => {
        const route = undocumentedRoutes.find(r => r.path === priorityPath);
        if (route) {
            console.log(`   🔥 ${route.path} (${route.methods.join(', ')})`);
        }
    });
}

main(); 