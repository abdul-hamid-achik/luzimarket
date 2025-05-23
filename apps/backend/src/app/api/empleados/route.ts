import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { empleados } from '@/db/schema';

export async function GET() {
    const allEmpleados = await dbService.select(empleados);
    return NextResponse.json(allEmpleados);
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const inserted = await dbService.insertReturning(empleados, data);
    return NextResponse.json(inserted);
} 