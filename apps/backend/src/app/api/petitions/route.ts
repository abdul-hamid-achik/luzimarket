import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { petitions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/petitions:
 *   get:
 *     summary: Get all petitions
 *     description: Retrieve a list of all customer petitions and requests
 *     tags: [Petitions]
 *     responses:
 *       200:
 *         description: List of petitions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Petition ID
 *                   type:
 *                     type: string
 *                     description: Type of petition
 *                     example: product_request
 *                   title:
 *                     type: string
 *                     description: Petition title
 *                     example: Request for organic vegetables
 *                   description:
 *                     type: string
 *                     description: Detailed description of the petition
 *                   status:
 *                     type: string
 *                     description: Current status of the petition
 *                     example: pending
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Petition creation date
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Petition last update date
 *       500:
 *         description: Failed to fetch petitions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new petition
 *     description: Submit a new customer petition or request
 *     tags: [Petitions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of petition
 *                 example: product_request
 *                 enum:
 *                   - product_request
 *                   - service_complaint
 *                   - feature_request
 *                   - delivery_issue
 *                   - other
 *               title:
 *                 type: string
 *                 description: Brief title for the petition
 *                 example: Request for organic vegetables
 *               description:
 *                 type: string
 *                 description: Detailed description of the petition or request
 *                 example: Would like to see more organic vegetable options in the store
 *     responses:
 *       201:
 *         description: Petition created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Created petition ID
 *                 type:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                   default: pending
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing fields
 *       500:
 *         description: Failed to create petition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(petitions);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { type, title, description } = await request.json();
    if (!type || !title || !description) {
        return NextResponse.json(
            { error: 'Missing fields' },
            { status: StatusCodes.BAD_REQUEST }
        );
    }
    let created;
    try {
        [created] = await dbService.insertReturning(petitions, { type, title, description });
    } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'petitions_pkey') {
            console.warn('Petitions ID sequence out-of-sync, resetting sequence and retrying insert');
            await dbService.execute(sql`SELECT setval(pg_get_serial_sequence('petitions','id'), (SELECT MAX(id) FROM petitions))`);
            [created] = await dbService.insertReturning(petitions, { type, title, description });
        } else {
            console.error('Error creating petition:', error);
            return NextResponse.json({ error: 'Failed to create petition' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
        }
    }
    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 