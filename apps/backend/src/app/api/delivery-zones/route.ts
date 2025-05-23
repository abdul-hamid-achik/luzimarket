import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService } from '@/db/service';
import { deliveryZones } from '@/db/schema';

/**
 * @swagger
 * /api/delivery-zones:
 *   get:
 *     summary: Get delivery zones
 *     description: Retrieve a list of all available delivery zones and their coverage areas
 *     tags: [Reference Data]
 *     responses:
 *       200:
 *         description: List of delivery zones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Delivery zone ID
 *                   name:
 *                     type: string
 *                     description: Zone name
 *                   description:
 *                     type: string
 *                     description: Zone description
 *                   deliveryFee:
 *                     type: number
 *                     description: Delivery fee for this zone
 *       500:
 *         description: Failed to fetch delivery zones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  const items = await dbService.select(deliveryZones);
  return NextResponse.json(items, { status: StatusCodes.OK });
}
