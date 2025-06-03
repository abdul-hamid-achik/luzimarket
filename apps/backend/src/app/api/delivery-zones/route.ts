import { NextRequest, NextResponse } from 'next/server';
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');
    const sortParam = searchParams.get('sort');
    const _postalCodeParam = searchParams.get('postalCode'); // TODO: Implement postal code filtering
    const stateParam = searchParams.get('state');

    // Start with basic select and convert numeric values
    let items = await dbService.select(deliveryZones);

    // Convert numeric values from strings to numbers (PostgreSQL returns numeric as strings)
    items = items.map((item: any) => ({
      ...item,
      fee: Number(item.fee) || 0,
    }));

    // Filter by active status if specified and the column exists
    if (activeParam && items.length > 0 && 'isActive' in items[0]) {
      if (activeParam === 'true') {
        items = items.filter(item => item.isActive === true);
      } else if (activeParam === 'false') {
        items = items.filter(item => item.isActive === false);
      }
    }

    // Sort results if specified
    if (sortParam === 'name') {
      items = items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortParam === 'fee') {
      items = items.sort((a, b) => a.fee - b.fee);
    }

    // Filter by state
    if (stateParam) {
      // State to cities mapping based on Mexican geography
      const stateCityMapping: Record<string, string[]> = {
        'durango': ['Gómez Palacio', 'Lerdo'],
        'coahuila': ['Torreón', 'Saltillo'],
        'nuevo-leon': ['Monterrey'],
        'chihuahua': ['Chihuahua', 'Ciudad Juárez'],
        'cdmx': ['CDMX']
      };

      const normalizedState = stateParam.toLowerCase();
      const allowedCities = stateCityMapping[normalizedState];

      if (allowedCities) {
        items = items.filter(zone =>
          allowedCities.some(city =>
            zone.name.toLowerCase().includes(city.toLowerCase())
          )
        );
      } else {
        // If state not found, return empty array
        items = [];
      }
    }

    // Deduplicate by zone name - keep the best option for each city
    // Priority: active zones first, then lowest fee
    const uniqueZones = new Map<string, typeof items[0]>();

    for (const zone of items) {
      const existingZone = uniqueZones.get(zone.name);

      if (!existingZone) {
        // First zone with this name
        uniqueZones.set(zone.name, zone);
      } else {
        // Choose the better zone: active first, then lowest fee
        const shouldReplace =
          (!existingZone.isActive && zone.isActive) ||
          (existingZone.isActive === zone.isActive && zone.fee < existingZone.fee);

        if (shouldReplace) {
          uniqueZones.set(zone.name, zone);
        }
      }
    }

    // Convert back to array
    items = Array.from(uniqueZones.values());

    return NextResponse.json(items, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Error fetching delivery zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery zones' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
