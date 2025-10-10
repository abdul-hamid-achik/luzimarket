export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, vendors, adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';
import { logAuthEvent } from '@/lib/audit-helpers';

/**
 * POST /api/auth/2fa/verify
 * 
 * Verifies a TOTP code and completes 2FA setup.
 * This endpoint is called after the user scans the QR code and enters a verification code.
 * 
 * Body: { token: string }
 * 
 * Flow:
 * 1. Verify user is authenticated
 * 2. Get user's stored secret
 * 3. Verify the TOTP token
 * 4. If valid, enable 2FA for the user
 * 5. Return success/failure
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'TOTP token is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as 'customer' | 'vendor' | 'admin';

    // Get user's current 2FA secret
    let userData;

    switch (userRole) {
      case 'customer':
        const [customerData] = await db
          .select({
            twoFactorSecret: users.twoFactorSecret,
            twoFactorEnabled: users.twoFactorEnabled,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        userData = customerData;
        break;

      case 'vendor':
        const [vendorData] = await db
          .select({
            twoFactorSecret: vendors.twoFactorSecret,
            twoFactorEnabled: vendors.twoFactorEnabled,
          })
          .from(vendors)
          .where(eq(vendors.id, userId))
          .limit(1);
        userData = vendorData;
        break;

      case 'admin':
        const [adminData] = await db
          .select({
            twoFactorSecret: adminUsers.twoFactorSecret,
            twoFactorEnabled: adminUsers.twoFactorEnabled,
          })
          .from(adminUsers)
          .where(eq(adminUsers.id, userId))
          .limit(1);
        userData = adminData;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid user role' },
          { status: 400 }
        );
    }

    if (!userData || !userData.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA setup not initiated. Please start the setup process first.' },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: userData.twoFactorSecret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''), // Remove any spaces
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Enable 2FA for the user
    let updateResult;

    switch (userRole) {
      case 'customer':
        updateResult = await db
          .update(users)
          .set({
            twoFactorEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        break;

      case 'vendor':
        updateResult = await db
          .update(vendors)
          .set({
            twoFactorEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, userId))
          .returning({ id: vendors.id });
        break;

      case 'admin':
        updateResult = await db
          .update(adminUsers)
          .set({
            twoFactorEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(adminUsers.id, userId))
          .returning({ id: adminUsers.id });
        break;
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to enable 2FA' },
        { status: 500 }
      );
    }

    // Log 2FA verification success
    await logAuthEvent({
      action: '2fa_verified',
      userId,
      userEmail: session.user.email!,
      userType: userRole,
      details: {
        verifiedAt: new Date().toISOString(),
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been successfully enabled!',
    });

  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
