import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { users } from '@/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await dbService.findFirst(users, eq(users.id, id));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: StatusCodes.NOT_FOUND });
  }
  const { password: _pw, ...rest } = user;
  return NextResponse.json(rest, { status: StatusCodes.OK });
}
