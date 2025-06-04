import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const user = await dbService.findFirst(users, eq(users.id, id));
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Return user without password
        const { password: _pw, ...userResponse } = user;
        return NextResponse.json(userResponse, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Update a specific user's information
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, employee, customer, vendor]
 *               isActive:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 description: Optional - only include if changing password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Failed to update user
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, name, role, isActive, password } = body;

        // Check if user exists
        const existingUser = await dbService.findFirst(users, eq(users.id, id));
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: StatusCodes.BAD_REQUEST }
                );
            }

            // Check if email is already taken by another user
            const emailExists = await dbService.findFirst(users, eq(users.email, email));
            if (emailExists && emailExists.id !== id) {
                return NextResponse.json(
                    { error: 'Email already exists' },
                    { status: StatusCodes.CONFLICT }
                );
            }
        }

        // Validate password if provided
        if (password && password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (email !== undefined) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Hash password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        // Update user
        await dbService.update(users, updateData, eq(users.id, id));

        // Return updated user (without password)
        const updatedUser = await dbService.findFirst(users, eq(users.id, id));
        if (!updatedUser) {
            return NextResponse.json(
                { error: 'Failed to fetch updated user' },
                { status: StatusCodes.INTERNAL_SERVER_ERROR }
            );
        }

        const { password: _pw, ...userResponse } = updatedUser;
        return NextResponse.json(userResponse, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Delete a specific user account
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if user exists
        const existingUser = await dbService.findFirst(users, eq(users.id, id));
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Delete user
        await dbService.delete(users, eq(users.id, id));

        return NextResponse.json(
            { message: 'User deleted successfully' },
            { status: StatusCodes.OK }
        );
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 