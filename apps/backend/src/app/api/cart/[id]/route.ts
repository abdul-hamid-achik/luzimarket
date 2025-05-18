// @ts-ignore
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, cartItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { StatusCodes } from 'http-status-codes';

function getSessionId(request: NextRequest): number | null {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
    const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
    if (typeof payload === 'object' && 'sessionId' in payload) return (payload as any).sessionId;
  } catch { }
  return null;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
  const itemId = Number(params.id);
  const { quantity } = await request.json();
  const updated = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId)).returning().execute();
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: StatusCodes.NOT_FOUND });
  }
  return NextResponse.json(updated[0], { status: StatusCodes.OK });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessionId = getSessionId(request);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
  const itemId = Number(params.id);
  await db.delete(cartItems).where(eq(cartItems.id, itemId)).execute();
  return NextResponse.json({ success: true }, { status: StatusCodes.OK });
}
