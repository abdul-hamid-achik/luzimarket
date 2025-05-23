import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { users } from '@/db/schema';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  if (data.password !== undefined) delete data.password;

  await dbService.update(users, data, eq(users.id, id));

  // Get the updated user
  const updated = await dbService.findFirst(users, eq(users.id, id));
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: StatusCodes.NOT_FOUND });
  }

  const { password: _pw, ...rest } = updated;
  return NextResponse.json(rest, { status: StatusCodes.OK });
}
