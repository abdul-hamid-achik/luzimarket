import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { empleados } from '@/db/schema';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const empleadoId = id;
    const result = await dbService.findFirst(empleados, eq(empleados.id, empleadoId));
    if (!result) {
        return NextResponse.json({ error: 'Empleado not found' }, { status: 404 });
    }
    return NextResponse.json(result);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await request.json();
    const empleadoId = id;
    await dbService.update(empleados, data, eq(empleados.id, empleadoId));

    // Get the updated empleado
    const updated = await dbService.findFirst(empleados, eq(empleados.id, empleadoId));
    return NextResponse.json(updated);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const empleadoId = id;
    await dbService.delete(empleados, eq(empleados.id, empleadoId));
    return NextResponse.json({ success: true });
} 