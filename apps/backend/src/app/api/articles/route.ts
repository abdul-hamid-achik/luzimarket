import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { editorialArticles } from '@/db/schema';

export async function GET() {
  const items = await db.select().from(editorialArticles);
  return NextResponse.json(items, { status: StatusCodes.OK });
}
