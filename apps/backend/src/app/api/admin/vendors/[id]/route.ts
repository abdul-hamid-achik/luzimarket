import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { vendors, users } from '@/db/schema';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/admin/vendors/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     description: Retrieve a specific vendor with user information
 *     tags: [Admin, Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details
 *       404:
 *         description: Vendor not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const vendor = await dbService.raw
            .select({
                id: vendors.id,
                businessName: vendors.businessName,
                contactPerson: vendors.contactPerson,
                phone: vendors.phone,
                address: vendors.address,
                taxId: vendors.taxId,
                commissionRate: vendors.commissionRate,
                status: vendors.status,
                createdAt: vendors.createdAt,
                updatedAt: vendors.updatedAt,
                email: users.email,
                userName: users.name,
                isActive: users.isActive,
                userId: vendors.userId
            })
            .from(vendors)
            .leftJoin(users, eq(vendors.userId, users.id))
            .where(eq(vendors.id, id))
            .limit(1);

        if (!vendor || vendor.length === 0) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        return NextResponse.json(vendor[0], { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vendor' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/admin/vendors/{id}:
 *   put:
 *     summary: Update vendor
 *     description: Update vendor information and status
 *     tags: [Admin, Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               taxId:
 *                 type: string
 *               commissionRate:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, approved, suspended, rejected]
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *       404:
 *         description: Vendor not found
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Check if vendor exists
        const existingVendor = await dbService.findFirst(vendors, eq(vendors.id, id));
        if (!existingVendor) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Update vendor
        await dbService.update(
            vendors,
            {
                ...body,
                updatedAt: new Date()
            },
            eq(vendors.id, id)
        );

        return NextResponse.json(
            { message: 'Vendor updated successfully' },
            { status: StatusCodes.OK }
        );
    } catch (error) {
        console.error('Error updating vendor:', error);
        return NextResponse.json(
            { error: 'Failed to update vendor' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/admin/vendors/{id}:
 *   delete:
 *     summary: Delete vendor
 *     description: Delete a vendor and optionally deactivate the associated user
 *     tags: [Admin, Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 *       404:
 *         description: Vendor not found
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if vendor exists
        const existingVendor = await dbService.findFirst(vendors, eq(vendors.id, id));
        if (!existingVendor) {
            return NextResponse.json(
                { error: 'Vendor not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Delete vendor
        await dbService.delete(vendors, eq(vendors.id, id));

        // Optionally update user role back to customer
        if (existingVendor.userId) {
            await dbService.update(
                users,
                { role: 'customer' },
                eq(users.id, existingVendor.userId)
            );
        }

        return NextResponse.json(
            { message: 'Vendor deleted successfully' },
            { status: StatusCodes.OK }
        );
    } catch (error) {
        console.error('Error deleting vendor:', error);
        return NextResponse.json(
            { error: 'Failed to delete vendor' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 