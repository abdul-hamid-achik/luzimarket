import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService } from '@/db/service';
import { favorites } from '@/db/schema';

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     description: Retrieve a list of user's favorite products
 *     tags: [Favorites]
 *     responses:
 *       200:
 *         description: List of favorite products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Favorite ID
 *                   userId:
 *                     type: string
 *                     description: User ID
 *                   productId:
 *                     type: string
 *                     description: Product ID
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: When favorite was added
 *       500:
 *         description: Failed to fetch favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(favorites);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 