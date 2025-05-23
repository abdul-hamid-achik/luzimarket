/**
 * Common OpenAPI documentation templates and helpers for API routes
 */

// Common response schemas that can be reused
export const commonResponses = {
    unauthorized: {
        description: 'Unauthorized access',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Unauthorized' },
                        message: { type: 'string', example: 'Authentication required' }
                    }
                }
            }
        }
    },
    forbidden: {
        description: 'Forbidden access',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Forbidden' },
                        message: { type: 'string', example: 'Insufficient permissions' }
                    }
                }
            }
        }
    },
    notFound: {
        description: 'Resource not found',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Not Found' },
                        message: { type: 'string', example: 'Resource not found' }
                    }
                }
            }
        }
    },
    serverError: {
        description: 'Internal server error',
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/Error'
                }
            }
        }
    }
};

// Common security schemes
export const commonSecurity = {
    bearerAuth: [{ bearerAuth: [] }],
    apiKey: [{ ApiKeyAuth: [] }]
};

// Template for GET endpoints
export const getEndpointTemplate = (path: string, summary: string, description: string, tag: string, responseSchema?: string) => `
/**
 * @swagger
 * ${path}:
 *   get:
 *     summary: ${summary}
 *     description: ${description}
 *     tags: [${tag}]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               ${responseSchema ? `$ref: '#/components/schemas/${responseSchema}'` : 'type: object'}
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
`;

// Template for POST endpoints
export const postEndpointTemplate = (path: string, summary: string, description: string, tag: string, requestSchema?: string, responseSchema?: string) => `
/**
 * @swagger
 * ${path}:
 *   post:
 *     summary: ${summary}
 *     description: ${description}
 *     tags: [${tag}]
 *     ${requestSchema ? `requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${requestSchema}'` : ''}
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               ${responseSchema ? `$ref: '#/components/schemas/${responseSchema}'` : 'type: object'}
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
`;

// Template for PUT endpoints
export const putEndpointTemplate = (path: string, summary: string, description: string, tag: string, requestSchema?: string, responseSchema?: string) => `
/**
 * @swagger
 * ${path}:
 *   put:
 *     summary: ${summary}
 *     description: ${description}
 *     tags: [${tag}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     ${requestSchema ? `requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${requestSchema}'` : ''}
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               ${responseSchema ? `$ref: '#/components/schemas/${responseSchema}'` : 'type: object'}
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
`;

// Template for DELETE endpoints
export const deleteEndpointTemplate = (path: string, summary: string, description: string, tag: string) => `
/**
 * @swagger
 * ${path}:
 *   delete:
 *     summary: ${summary}
 *     description: ${description}
 *     tags: [${tag}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       204:
 *         description: Resource deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
`;

// Helper to generate schema for common data types
export const generateSchema = (fields: { [key: string]: { type: string; description?: string; example?: any; required?: boolean } }) => {
    const properties: any = {};
    const required: string[] = [];

    Object.entries(fields).forEach(([key, value]) => {
        properties[key] = {
            type: value.type,
            ...(value.description && { description: value.description }),
            ...(value.example !== undefined && { example: value.example })
        };

        if (value.required) {
            required.push(key);
        }
    });

    return {
        type: 'object',
        properties,
        ...(required.length > 0 && { required })
    };
}; 