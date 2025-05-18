import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { empleados } from '@/db/schema';

export async function GET() {
    const allEmpleados = await db.select().from(empleados);
    return NextResponse.json(allEmpleados);
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const inserted = await db.insert(empleados).values(data).returning();
    return NextResponse.json(inserted);
} 