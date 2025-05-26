import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { empleados } from '@/db/schema';

/**
 * @swagger
 * /api/empleados:
 *   get:
 *     summary: Get all employees
 *     description: Retrieve a list of all employees in the system
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Employee ID
 *                   name:
 *                     type: string
 *                     description: Employee name
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Employee email address
 *                   position:
 *                     type: string
 *                     description: Employee position/role
 *                   department:
 *                     type: string
 *                     description: Employee department
 *                   phone:
 *                     type: string
 *                     description: Employee phone number
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the employee is active
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Employee creation date
 *       500:
 *         description: Failed to fetch employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new employee
 *     description: Add a new employee to the system
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - position
 *             properties:
 *               name:
 *                 type: string
 *                 description: Employee name
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *                 example: juan.perez@luzimarket.com
 *               position:
 *                 type: string
 *                 description: Employee position/role
 *                 example: Sales Manager
 *               department:
 *                 type: string
 *                 description: Employee department
 *                 example: Sales
 *               phone:
 *                 type: string
 *                 description: Employee phone number
 *                 example: +52 871 123 4567
 *               isActive:
 *                 type: boolean
 *                 description: Whether the employee is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Created employee ID
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Failed to create employee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const allEmpleados = await dbService.select(empleados);
    return NextResponse.json(allEmpleados);
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const inserted = await dbService.insertReturning(empleados, data);
    return NextResponse.json(inserted);
} 