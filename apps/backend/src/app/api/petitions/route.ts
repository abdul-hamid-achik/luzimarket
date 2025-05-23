import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { petitions } from '@/db/schema';
import { sql } from 'drizzle-orm';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    const items = await dbService.select(petitions);
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(request: NextRequest) {
    const { type, title, description } = await request.json();
    if (!type || !title || !description) {
        return NextResponse.json(
            { error: 'Missing fields' },
            { status: StatusCodes.BAD_REQUEST }
        );
    }
    let created;
    try {
        [created] = await dbService.insertReturning(petitions, { type, title, description });
    } catch (error: any) {
        if (error.code === '23505' && error.constraint === 'petitions_pkey') {
            console.warn('Petitions ID sequence out-of-sync, resetting sequence and retrying insert');
            await dbService.execute(sql`SELECT setval(pg_get_serial_sequence('petitions','id'), (SELECT MAX(id) FROM petitions))`);
            [created] = await dbService.insertReturning(petitions, { type, title, description });
        } else {
            console.error('Error creating petition:', error);
            return NextResponse.json({ error: 'Failed to create petition' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
        }
    }
    return NextResponse.json(created, { status: StatusCodes.CREATED });
} 