import { NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { states } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/states:
 *   get:
 *     summary: Get all states/regions
 *     description: Retrieve a list of all available states or regions for shipping and addressing
 *     tags: [Reference Data]
 *     responses:
 *       200:
 *         description: List of states/regions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: State ID
 *                   name:
 *                     type: string
 *                     description: State name
 *                   code:
 *                     type: string
 *                     description: State code
 *       500:
 *         description: Failed to fetch states
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  const items = await dbService.select(states);
  return NextResponse.json(items, { status: StatusCodes.OK });
}
