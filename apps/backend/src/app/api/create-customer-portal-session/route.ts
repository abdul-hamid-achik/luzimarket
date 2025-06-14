import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbService, eq } from '@/db/service';
import { sessions, users } from '@/db/schema';

/**
 * @swagger
 * /api/create-customer-portal-session:
 *   post:
 *     summary: Create Stripe Customer Portal session
 *     description: Creates a Stripe Customer Portal session for managing payment methods, viewing invoices, and subscription management
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnUrl:
 *                 type: string
 *                 description: URL to redirect after portal session
 *                 example: https://example.com/account
 *     responses:
 *       200:
 *         description: Customer portal session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to redirect customer to Stripe portal
 *                   example: https://billing.stripe.com/session/xxx
 *       400:
 *         description: Customer needs to make a purchase first
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to create portal session
 *       503:
 *         description: Payment service not configured
 */

// Check if Stripe is configured
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

function getSessionId(request: NextRequest): string | null {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    try {
        const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-tests';
        const payload = jwt.verify(auth.split(' ')[1], jwtSecret);
        if (typeof payload === 'object' && 'sessionId' in payload) return String(payload.sessionId);
    } catch { }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        // Check if Stripe is configured
        if (!stripe) {
            return NextResponse.json(
                { error: 'Payment service not configured' },
                { status: 503 }
            );
        }

        const sessionId = getSessionId(request);
        if (!sessionId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get session and user info
        const session = await dbService.findFirst(sessions, eq(sessions.id, sessionId));
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await dbService.findFirst(users, eq(users.id, session.userId));
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get return URL from request body
        const { returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/perfil` } = await request.json();

        // Check if user has a Stripe customer ID
        if (!user.stripe_customer_id || user.stripe_customer_id.trim() === '') {
            // Create a new Stripe customer if they don't have one
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id
                }
            });

            // Update user with Stripe customer ID
            await dbService.update(users, { 
                stripe_customer_id: customer.id,
                updatedAt: new Date()
            }, eq(users.id, user.id));

            // Now use the new customer ID
            user.stripe_customer_id = customer.id;
        }

        // Create the portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: returnUrl,
            // Configure what features are available in the portal
            configuration: {
                features: {
                    invoice_history: {
                        enabled: true,
                    },
                    payment_method_update: {
                        enabled: true,
                    },
                    // Disable subscription management if not using subscriptions
                    subscription_cancel: {
                        enabled: false,
                    },
                    subscription_pause: {
                        enabled: false,
                    },
                    subscription_update: {
                        enabled: false,
                    },
                },
                business_profile: {
                    headline: 'LUZIMARKET - Gestiona tus métodos de pago',
                },
            },
        });

        return NextResponse.json({
            url: portalSession.url,
        });

    } catch (error) {
        console.error('Error creating customer portal session:', error);
        
        // Check if error is because customer has no payment methods
        if (error instanceof Error && error.message?.includes('has no payment methods')) {
            return NextResponse.json(
                { error: 'Please make a purchase first to manage payment methods' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create customer portal session' },
            { status: 500 }
        );
    }
}