import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { empleados } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const result = await db.select().from(empleados).where(eq(empleados.id, Number(id)));
    if (result.length === 0) {
        return NextResponse.json({ error: 'Empleado not found' }, { status: 404 });
    }
    return NextResponse.json(result[0]);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const data = await request.json();
    const updated = await db.update(empleados).set(data).where(eq(empleados.id, Number(id))).returning();
    return NextResponse.json(updated);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    await db.delete(empleados).where(eq(empleados.id, Number(id))).execute();
    return NextResponse.json({ success: true });
} 