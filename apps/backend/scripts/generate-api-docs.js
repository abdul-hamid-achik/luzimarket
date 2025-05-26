#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to convert path to OpenAPI format
function convertToOpenAPIPath(filePath) {
    return filePath
        .replace(/\[([^\]]+)\]/g, '{$1}')  // Convert [id] to {id}
        .replace(/\[\.\.\.([^\]]+)\]/g, '{...}')  // Convert [...nextauth] to {...}
        .replace(/\/route$/, '')  // Remove /route at the end
        .replace(/\/$/, '');  // Remove trailing slash
}

// Extract HTTP methods from route file
function extractMethods(fileContent) {
    const methods = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/g;
    let match;

    while ((match = methodRegex.exec(fileContent)) !== null) {
        methods.push(match[1]);
    }

    return methods;
}

// Generate documentation template for a route
function generateDocTemplate(apiPath, method, routePath) {
    const segments = apiPath.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'root';
    const isParam = lastSegment.includes('{');

    // Determine appropriate tag based on path
    let tag = 'General';
    if (apiPath.includes('/admin/')) tag = 'Admin';
    else if (apiPath.includes('/auth/')) tag = 'Authentication';
    else if (apiPath.includes('/products/')) tag = 'Products';
    else if (apiPath.includes('/orders/')) tag = 'Orders';
    else if (apiPath.includes('/cart/')) tag = 'Cart';
    else if (apiPath.includes('/petitions/')) tag = 'Petitions';
    else if (apiPath.includes('/categories/')) tag = 'Categories';
    else if (apiPath.includes('/brands/')) tag = 'Brands';
    else if (apiPath.includes('/debug/')) tag = 'Debug';
    else if (apiPath.includes('/health')) tag = 'Health';
    else if (apiPath.includes('/profiles/')) tag = 'Profiles';
    else if (apiPath.includes('/articles/')) tag = 'Editorial';

    // Generate summary and description
    let summary, description;
    const resourceName = lastSegment.replace(/[{}]/g, '');

    switch (method) {
        case 'GET':
            if (isParam) {
                summary = `Get ${resourceName}`;
                description = `Retrieve a specific ${resourceName} by ID`;
            } else {
                summary = `Get all ${resourceName}`;
                description = `Retrieve a list of ${resourceName}`;
            }
            break;
        case 'POST':
            summary = `Create ${resourceName}`;
            description = `Create a new ${resourceName}`;
            break;
        case 'PUT':
            summary = `Update ${resourceName}`;
            description = `Update an existing ${resourceName}`;
            break;
        case 'DELETE':
            summary = `Delete ${resourceName}`;
            description = `Delete a ${resourceName}`;
            break;
        case 'PATCH':
            summary = `Partially update ${resourceName}`;
            description = `Partially update a ${resourceName}`;
            break;
        default:
            summary = `${method} ${resourceName}`;
            description = `${method} operation for ${resourceName}`;
    }

    // Generate parameters if path has parameters
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

    // Generate request body for POST/PUT methods
    let requestBody = '';
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestBody = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # TODO: Define proper schema`;
    }

    // Generate responses based on method
    let responses;
    switch (method) {
        case 'GET':
            responses = `
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               # TODO: Define proper schema
 *       404:
 *         description: Resource not found
 *       500:
 *         $ref: '#/components/schemas/Error'`;
            break;
        case 'POST':
            responses = `
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               # TODO: Define proper schema
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
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               # TODO: Define proper schema
 *       404:
 *         description: Resource not found
 *       400:
 *         description: Bad request
 *       500:
 *         $ref: '#/components/schemas/Error'`;
            break;
        case 'DELETE':
            responses = `
 *     responses:
 *       204:
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
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
 *     tags: [${tag}]${parameters}${requestBody}${responses}
 */`;
}

// Find all route files
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

// Main execution
function main() {
    const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
    const routeFiles = findRouteFiles(apiDir);

    console.log('🔍 Found API routes that need documentation:\n');

    const documentationNeeded = [];

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
                    console.log(`📄 ${openApiPath}`);
                    console.log(`   Methods: ${methods.join(', ')}`);
                    console.log(`   File: ${routeFile}`);

                    documentationNeeded.push({
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

    console.log(`\n📊 Summary:`);
    console.log(`   Total routes found: ${routeFiles.length}`);
    console.log(`   Routes needing documentation: ${documentationNeeded.length}`);

    // Generate documentation templates
    if (process.argv.includes('--generate')) {
        console.log('\n🛠️  Generating documentation templates...\n');

        for (const route of documentationNeeded) {
            console.log(`\n// Documentation for ${route.path}`);
            console.log(`// File: ${route.file}`);

            for (const method of route.methods) {
                const template = generateDocTemplate(route.path, method, route.file);
                console.log(template);
            }

            console.log('\n' + '='.repeat(80));
        }
    } else {
        console.log('\n💡 Run with --generate flag to see documentation templates');
        console.log('   Example: node scripts/generate-api-docs.js --generate');
    }
}

main(); 