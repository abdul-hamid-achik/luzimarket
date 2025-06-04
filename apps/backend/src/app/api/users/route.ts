import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq, and, or } from '@/db/service';
import { ilike, asc, desc } from 'drizzle-orm';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users for admin management
 *     description: Retrieve all users with filtering, sorting, and pagination support
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, employee, customer, vendor]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by user status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Failed to fetch users
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const status = searchParams.get('status') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query conditions
        const conditions = [];

        // Search by name or email
        if (search) {
            conditions.push(
                or(
                    ilike(users.name, `%${search}%`),
                    ilike(users.email, `%${search}%`)
                )
            );
        }

        // Filter by role
        if (role) {
            conditions.push(eq(users.role, role as any));
        }

        // Filter by status (active/inactive)
        if (status === 'active') {
            conditions.push(eq(users.isActive, true));
        } else if (status === 'inactive') {
            conditions.push(eq(users.isActive, false));
        }

        // Build where clause
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Build order clause
        const orderClause = sortOrder === 'asc'
            ? asc((users as any)[sortBy] || users.createdAt)
            : desc((users as any)[sortBy] || users.createdAt);

        // Execute query
        let query = dbService.raw
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                isActive: users.isActive,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt
            })
            .from(users);

        if (whereClause) {
            query = query.where(whereClause);
        }

        const allUsers = await query
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        return NextResponse.json(allUsers, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, employee, customer, vendor]
 *                 default: customer
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       409:
 *         description: User already exists
 *       500:
 *         description: Failed to create user
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role = 'customer', isActive = true } = body;

        // Validate required fields
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, password, and name are required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Check if user already exists
        const existingUser = await dbService.findFirst(users, eq(users.email, email));
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: StatusCodes.CONFLICT }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUsers = await dbService.insertReturning(users, {
            email,
            password: hashedPassword,
            name,
            role: role as any,
            isActive
        });

        const newUser = newUsers[0] as any;

        // Return user without password
        const { password: _pw, ...userResponse } = newUser;
        return NextResponse.json(userResponse, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 