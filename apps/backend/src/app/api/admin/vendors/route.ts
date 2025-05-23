import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { vendors, users } from '@/db/schema';

/**
 * @swagger
 * /api/admin/vendors:
 *   get:
 *     summary: Get all vendors for admin
 *     description: Retrieve all vendors with their user information for admin management
 *     tags: [Admin, Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendors with user details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   businessName:
 *                     type: string
 *                   contactPerson:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [pending, approved, suspended, rejected]
 *                   commissionRate:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
export async function GET() {
    try {
        // Join vendors with users to get email information
        const allVendors = await dbService.raw
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
                isActive: users.isActive
            })
            .from(vendors)
            .leftJoin(users, eq(vendors.userId, users.id));

        return NextResponse.json(allVendors, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vendors' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/admin/vendors:
 *   post:
 *     summary: Create a new vendor
 *     description: Create a new vendor account for an existing user or create both user and vendor
 *     tags: [Admin, Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - contactPerson
 *               - phone
 *               - address
 *               - email
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Required if creating new user
 *               userId:
 *                 type: string
 *                 description: Use existing user ID or leave empty to create new user
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Vendor already exists for this user
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            businessName,
            contactPerson,
            phone,
            address,
            taxId,
            commissionRate = 10,
            email,
            password,
            userId
        } = body;

        // Validate required fields
        if (!businessName || !contactPerson || !phone || !address || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        let vendorUserId = userId;

        // If no userId provided, check if user exists or create new one
        if (!vendorUserId) {
            // Check if user already exists
            const existingUser = await dbService.findFirst(users, eq(users.email, email));

            if (existingUser) {
                vendorUserId = existingUser.id;
                // Update role to vendor if not already
                if (existingUser.role !== 'vendor') {
                    await dbService.update(users, { role: 'vendor' }, eq(users.id, existingUser.id));
                }
            } else {
                // Create new user
                if (!password) {
                    return NextResponse.json(
                        { error: 'Password required for new user' },
                        { status: StatusCodes.BAD_REQUEST }
                    );
                }

                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(password, 10);

                const newUsers = await dbService.insertReturning(users, {
                    email,
                    password: hashedPassword,
                    name: contactPerson,
                    role: 'vendor'
                });

                vendorUserId = newUsers[0].id;
            }
        }

        // Check if vendor already exists for this user
        const existingVendor = await dbService.findFirst(vendors, eq(vendors.userId, vendorUserId));
        if (existingVendor) {
            return NextResponse.json(
                { error: 'Vendor already exists for this user' },
                { status: StatusCodes.CONFLICT }
            );
        }

        // Create vendor
        const newVendors = await dbService.insertReturning(vendors, {
            userId: vendorUserId,
            businessName,
            contactPerson,
            phone,
            address,
            taxId,
            commissionRate,
            status: 'pending',
            updatedAt: new Date()
        });

        return NextResponse.json(newVendors[0], { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error creating vendor:', error);
        return NextResponse.json(
            { error: 'Failed to create vendor' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 