import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { brands } from '@/db/schema';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';

export async function GET() {
    const items = await dbService.select(brands);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 