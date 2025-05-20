import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { empleados } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const empleadoId = id;
    const result = await db.select().from(empleados).where(eq(empleados.id, empleadoId));
    if (result.length === 0) {
        return NextResponse.json({ error: 'Empleado not found' }, { status: 404 });
    }
    return NextResponse.json(result[0]);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await request.json();
    const empleadoId = id;
    const updated = await db.update(empleados).set(data).where(eq(empleados.id, empleadoId)).returning();
    return NextResponse.json(updated);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const empleadoId = id;
    await db.delete(empleados).where(eq(empleados.id, empleadoId)).execute();
    return NextResponse.json({ success: true });
} 