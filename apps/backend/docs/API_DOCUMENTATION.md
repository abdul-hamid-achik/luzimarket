# Luzi Market API Documentation

This document explains how to use and maintain the OpenAPI 3.0 documentation for the Luzi Market backend API.

## 📖 Viewing the Documentation

The API documentation is available in multiple formats:

### Swagger UI (Interactive Documentation)
**URL:** `http://localhost:8000/api/docs`

- Interactive interface to test API endpoints
- Try-it-out functionality for each endpoint
- Request/response examples
- Authentication support

### Redoc (Clean Documentation)
**URL:** `http://localhost:8000/api/docs/redoc`

- Clean, professional documentation layout
- Better for reading and understanding APIs
- Mobile-friendly design
- Superior typography and navigation

### OpenAPI Specification (JSON)
**URL:** `http://localhost:8000/api/docs/openapi.json`

- Raw OpenAPI 3.0 specification
- Can be imported into other tools (Postman, Insomnia, etc.)
- Used by client generators and testing tools

## 🛠️ Adding Documentation to Your API Routes

### Basic Documentation Template

Add this comment block above your route handler:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description of what this endpoint does
 *     tags: [YourTag]
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  // Your implementation
}
```

### Using Helper Templates

Import helpers from `@/lib/swagger-helpers`:

```typescript
import { getEndpointTemplate } from '@/lib/swagger-helpers';

// Use the template to generate documentation
console.log(getEndpointTemplate(
  '/api/products',
  'Get all products',
  'Returns a paginated list of products',
  'Products',
  'ProductList'
));
```

### Adding Parameters

For endpoints with parameters:

```typescript
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [photos, variants, reviews]
 *         description: Additional data to include
 */
```

### Adding Request Bodies

For POST/PUT endpoints:

```typescript
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
```

### Adding Authentication

For protected endpoints:

```typescript
/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get products (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products retrieved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
```

## 📋 Schema Definitions

### Adding New Schemas

Add schemas to `src/lib/swagger.ts` in the `components.schemas` section:

```typescript
NewSchema: {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Unique identifier' },
    name: { type: 'string', description: 'Display name' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name']
}
```

### Using the Schema Generator

```typescript
import { generateSchema } from '@/lib/swagger-helpers';

const productSchema = generateSchema({
  id: { type: 'string', description: 'Product ID', required: true },
  name: { type: 'string', description: 'Product name', required: true },
  price: { type: 'number', description: 'Price in cents', required: true },
  description: { type: 'string', description: 'Product description' },
});
```

## 🏷️ Available Tags

Current tags defined in the system:

- **Products** - Product management endpoints
- **Health** - Health check and monitoring
- **Authentication** - Auth and authorization
- **Orders** - Order management
- **Cart** - Shopping cart operations
- **Admin** - Administrative functions

## 🔧 Configuration

### Server URLs

The documentation automatically configures server URLs based on environment:

- **Development:** `http://localhost:8000`
- **Production:** `https://api.luzimarket.com` (configure in env)

### Security Schemes

Two authentication methods are configured:

1. **Bearer Token (JWT):**
   ```
   Authorization: Bearer <token>
   ```

2. **API Key:**
   ```
   X-API-Key: <api-key>
   ```

## 🎨 Customization

### Swagger UI Customization

Edit `src/app/api/docs/route.ts` to modify:
- Colors and theming
- Logo and branding
- Feature toggles
- Plugin configuration

### Redoc Customization

Edit `src/app/api/docs/redoc/route.ts` to modify:
- Theme and colors
- Typography
- Navigation behavior
- Custom CSS

## 📝 Best Practices

1. **Always add documentation** when creating new endpoints
2. **Use meaningful descriptions** that explain business logic
3. **Include examples** in your schemas
4. **Group related endpoints** with appropriate tags
5. **Document error responses** with clear messages
6. **Keep schemas DRY** by reusing common components
7. **Update documentation** when changing endpoint behavior

## 🔍 Troubleshooting

### Documentation Not Updating

1. Restart the development server
2. Check for syntax errors in @swagger comments
3. Verify file paths in swagger configuration

### Schema Not Found

1. Ensure schema is defined in `src/lib/swagger.ts`
2. Check spelling and case sensitivity
3. Verify the schema is properly exported

### Authentication Not Working

1. Check security schemes in swagger config
2. Verify token format and headers
3. Ensure endpoints specify correct security requirements

## 📚 Further Reading

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Redoc Documentation](https://redocly.com/docs/redoc/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc) 