import { NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export async function GET() {
    return NextResponse.json(
        { status: ReasonPhrases.OK },
        { status: StatusCodes.OK }
    );
} 