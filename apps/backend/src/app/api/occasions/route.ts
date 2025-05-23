import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { occasions } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/occasions:
 *   get:
 *     summary: Get all occasions
 *     description: Retrieve a list of special occasions for product categorization and marketing
 *     tags: [Reference Data]
 *     responses:
 *       200:
 *         description: List of occasions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Occasion ID
 *                   name:
 *                     type: string
 *                     description: Occasion name
 *                     example: Valentine's Day
 *                   description:
 *                     type: string
 *                     description: Occasion description
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     description: When the occasion starts
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     description: When the occasion ends
 *       500:
 *         description: Failed to fetch occasions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(occasions);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 