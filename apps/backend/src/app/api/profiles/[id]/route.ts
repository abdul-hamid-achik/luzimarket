import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const data = await request.json();
  if (data.password !== undefined) delete data.password;
  const updated = await db.update(users).set(data).where(eq(users.id, id)).returning().execute();
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: StatusCodes.NOT_FOUND });
  }
  const { password: _pw, ...rest } = updated[0];
  return NextResponse.json(rest, { status: StatusCodes.OK });
}
