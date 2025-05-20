import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: StatusCodes.NOT_FOUND });
  }
  const { password: _pw, ...rest } = user;
  return NextResponse.json(rest, { status: StatusCodes.OK });
}
