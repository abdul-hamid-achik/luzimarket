import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq, and } from '@/db/service';
import { products, productVariants, categories, vendors, photos } from '@/db/schema';
import { inArray, count } from 'drizzle-orm';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with vendor and category info
 *     description: Retrieve a list of all products with pagination, vendor, and category information
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of products to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, inactive, out_of_stock]
 *         description: Filter by product status
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured products only
 *     responses:
 *       200:
 *         description: List of products with vendor and category info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       slug:
 *                         type: string
 *                       status:
 *                         type: string
 *                       featured:
 *                         type: boolean
 *                       vendorName:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       photoCount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                 total:
 *                   type: number
 *                 hasMore:
 *                   type: boolean
 */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
        const status = searchParams.get('status');
        const vendorId = searchParams.get('vendorId');
        const categoryId = searchParams.get('categoryId');
        const featured = searchParams.get('featured') === 'true';

        // Build where conditions
        const whereConditions = [];
        if (status && ['draft', 'active', 'inactive', 'out_of_stock'].includes(status)) {
            whereConditions.push(eq(products.status, status as any));
        }
        if (vendorId?.trim()) {
            whereConditions.push(eq(products.vendorId, vendorId));
        }
        if (categoryId?.trim()) {
            whereConditions.push(eq(products.categoryId, categoryId));
        }
        if (featured) {
            whereConditions.push(eq(products.featured, true));
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Get total count
        const [{ total }] = await dbService.raw
            .select({ total: count() })
            .from(products)
            .where(whereClause);

        // Get products with joins for vendor and category info
        const query = dbService.raw
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                price: products.price,
                slug: products.slug,
                status: products.status,
                featured: products.featured,
                categoryId: products.categoryId,
                vendorId: products.vendorId,
                createdAt: products.createdAt,
                updatedAt: products.updatedAt,
                vendorName: vendors.businessName,
                categoryName: categories.name,
                categorySlug: categories.slug,
            })
            .from(products)
            .leftJoin(vendors, eq(products.vendorId, vendors.id))
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(whereClause)
            .limit(limit)
            .offset(offset);

        const productResults = await query;

        // Get photo counts for all products in one query
        const productIds = productResults.map((p: any) => p.id);
        const photoCounts = productIds.length > 0 ? await dbService.raw
            .select({
                productId: photos.productId,
                count: count()
            })
            .from(photos)
            .where(inArray(photos.productId, productIds))
            .groupBy(photos.productId) : [];

        const photoCountMap = photoCounts.reduce((acc: Record<string, number>, pc: any) => {
            acc[pc.productId] = pc.count;
            return acc;
        }, {} as Record<string, number>);

        // Combine results
        const enrichedProducts = productResults.map((product: any) => ({
            ...product,
            photoCount: photoCountMap[product.id] || 0
        }));

        const hasMore = offset + limit < total;

        return NextResponse.json({
            products: enrichedProducts,
            total,
            hasMore,
            limit,
            offset
        }, { status: StatusCodes.OK });

    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product with vendor support and enhanced attributes
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - description
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               slug:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               vendorId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, inactive, out_of_stock]
 *                 default: draft
 *               featured:
 *                 type: boolean
 *                 default: false
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                     attributes:
 *                       type: object
 *                     stock:
 *                       type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Failed to create product
 */
export async function POST(request: NextRequest) {
    try {
        const {
            name,
            description,
            price,
            slug,
            categoryId,
            vendorId,
            status = 'draft',
            featured = false,
            variants
        } = await request.json();

        if (!name || !description || !price || !categoryId) {
            return NextResponse.json(
                { error: 'Missing required fields: name, description, price, categoryId' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Generate slug if not provided
        const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Convert empty string vendorId to null for proper foreign key handling
        const cleanVendorId = vendorId && vendorId.trim() !== '' ? vendorId : null;

        let created: any;
        try {
            [created] = await dbService.insertReturning(products, {
                name,
                description,
                price,
                slug: productSlug,
                categoryId,
                vendorId: cleanVendorId,
                status,
                featured,
                updatedAt: new Date()
            });
        } catch (error: any) {
            console.error('Database insertReturning error:', error);
            // Handle unique constraint violations for PostgreSQL
            if (error.code === '23505' ||
                error.message?.includes('UNIQUE constraint failed') ||
                error.message?.includes('duplicate key value violates unique constraint') ||
                error.message?.includes('slug already exists')) {
                return NextResponse.json(
                    { error: 'Product slug already exists' },
                    { status: StatusCodes.CONFLICT }
                );
            }
            throw error; // Re-throw to be caught by outer catch block
        }

        // Create variants if provided
        if (variants && Array.isArray(variants) && variants.length > 0) {
            try {
                const variantData = variants.map((v: any) => ({
                    productId: created.id,
                    sku: v.sku,
                    attributes: JSON.stringify(v.attributes || {}),
                    stock: v.stock ?? 0,
                }));
                await dbService.insert(productVariants, variantData);
            } catch (variantError) {
                console.error('Error creating variants:', variantError);
                // Continue without failing the product creation
            }
        }

        return NextResponse.json(created, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 