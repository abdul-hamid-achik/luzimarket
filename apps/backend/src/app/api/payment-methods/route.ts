import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

function getSessionId(request: NextRequest): string | null {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
    const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
    if (typeof payload === 'object' && 'sessionId' in payload)
      return (payload as any).sessionId as string;
  } catch {}
  return null;
}

export async function GET(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const sessionId = getSessionId(request);
  let customerId: string | undefined;

  if (sessionId) {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (session?.userId) {
      const [user] = await db.select().from(users).where(eq(users.id, session.userId));
      customerId = user?.stripeCustomerId ?? undefined;
    }
  }

  if (!secret || !customerId) {
    // Fallback to static options when Stripe is not configured
    const fake = [
      { id: 'pm_fake_visa', label: 'VISA ****4242' },
      { id: 'pm_fake_mastercard', label: 'MasterCard ****4444' }
    ];
    return NextResponse.json(fake);
  }

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/payment_methods?customer=${customerId}&type=card`,
      {
        headers: { Authorization: `Bearer ${secret}` }
      }
    );
    if (!res.ok) {
      const msg = await res.text();
      console.error('Stripe error', msg);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }
    const data = await res.json();
    const paymentMethods = (data.data || []).map((pm: any) => ({
      id: pm.id,
      label: `${pm.card.brand.toUpperCase()} **** ${pm.card.last4}`
    }));
    return NextResponse.json(paymentMethods);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}
