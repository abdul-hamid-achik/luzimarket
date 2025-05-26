import { NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { brands } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get all brands
 *     description: Retrieve a list of all product brands
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Brand ID
 *                   name:
 *                     type: string
 *                     description: Brand name
 *                   description:
 *                     type: string
 *                     description: Brand description
 *       500:
 *         description: Failed to fetch brands
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(brands);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 