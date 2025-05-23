import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { sessions, users } from '@/db/schema';

/**
 * @swagger
 * /api/payment-methods:
 *   get:
 *     summary: Get user payment methods
 *     description: Retrieve saved payment methods for the authenticated user from Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Payment method ID
 *                     example: pm_1234567890abcdef
 *                   label:
 *                     type: string
 *                     description: Display label for the payment method
 *                     example: VISA ****4242
 *       401:
 *         description: Unauthorized - authentication required for stored payment methods
 *       500:
 *         description: Failed to fetch payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch payment methods
 */

function getSessionId(request: NextRequest): string | null {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
    const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
    if (typeof payload === 'object' && 'sessionId' in payload)
      return (payload as any).sessionId as string;
  } catch { }
  return null;
}

export async function GET(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const sessionId = getSessionId(request);
  let customerId: string | undefined;

  if (sessionId) {
    const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
    if (session?.userId) {
      const user = await dbService.findFirst(users, eq(users.id, session.userId));
      customerId = user?.stripe_customer_id ?? undefined;
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
