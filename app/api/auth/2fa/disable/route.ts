export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, vendors, adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';
import { logAuthEvent } from '@/lib/audit-helpers';

/**
 * POST /api/auth/2fa/disable
 * 
 * Disables TOTP-based 2FA for the authenticated user.
 * Requires current password or TOTP verification for security.
 * 
 * Body: { token?: string, password?: string }
 * 
 * Flow:
 * 1. Verify user is authenticated
 * 2. Verify either TOTP token or password
 * 3. Disable 2FA and clear secrets
 * 4. Return success/failure
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

    const { token, password } = await request.json();

    if (!token && !password) {
      return NextResponse.json(
        { error: 'Either TOTP token or password is required to disable 2FA' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role as 'customer' | 'vendor' | 'admin';

    // Get user's current 2FA status and credentials
    let userData;

    switch (userRole) {
      case 'customer':
        const [customerData] = await db
          .select({
            twoFactorSecret: users.twoFactorSecret,
            twoFactorEnabled: users.twoFactorEnabled,
            passwordHash: users.passwordHash,
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
            passwordHash: vendors.passwordHash,
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
            passwordHash: adminUsers.passwordHash,
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

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userData.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not currently enabled' },
        { status: 400 }
      );
    }

    // Verify authentication method
    let isVerified = false;

    if (token && userData.twoFactorSecret) {
      // Verify TOTP token
      isVerified = speakeasy.totp.verify({
        secret: userData.twoFactorSecret,
        encoding: 'base32',
        token: token.replace(/\s/g, ''),
        window: 2,
      });
    } else if (password && userData.passwordHash) {
      // Verify password
      const bcrypt = await import('bcryptjs');
      isVerified = await bcrypt.compare(password, userData.passwordHash);
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Invalid verification. Please check your token or password.' },
        { status: 400 }
      );
    }

    // Disable 2FA and clear secrets
    let updateResult;

    switch (userRole) {
      case 'customer':
        updateResult = await db
          .update(users)
          .set({
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: [],
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        break;

      case 'vendor':
        updateResult = await db
          .update(vendors)
          .set({
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: [],
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, userId))
          .returning({ id: vendors.id });
        break;

      case 'admin':
        updateResult = await db
          .update(adminUsers)
          .set({
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: [],
            updatedAt: new Date(),
          })
          .where(eq(adminUsers.id, userId))
          .returning({ id: adminUsers.id });
        break;
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }

    // Log 2FA disabled event
    await logAuthEvent({
      action: '2fa_disabled',
      userId,
      userEmail: session.user.email!,
      userType: userRole,
      details: {
        disabledAt: new Date().toISOString(),
        verificationMethod: token ? 'totp' : 'password',
      },
      severity: 'warning',
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been successfully disabled.',
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
