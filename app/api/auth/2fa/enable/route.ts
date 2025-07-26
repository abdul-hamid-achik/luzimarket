import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, vendors, adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * POST /api/auth/2fa/enable
 * 
 * Enables TOTP-based 2FA for the authenticated user.
 * Generates a secret key and QR code for authenticator app setup.
 * 
 * Flow:
 * 1. Verify user is authenticated
 * 2. Generate TOTP secret
 * 3. Create QR code for authenticator app
 * 4. Generate backup codes
 * 5. Store secret in database (but don't enable 2FA yet)
 * 6. Return QR code and backup codes to user
 * 
 * Note: 2FA is not actually enabled until user verifies with a TOTP code
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

    const userId = session.user.id;
    const userRole = session.user.role as 'customer' | 'vendor' | 'admin';
    
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `LuziMarket (${session.user.email})`,
      issuer: 'LuziMarket',
      length: 32,
    });

    // Generate backup codes (8 codes, 8 characters each)
    const backupCodes = Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

    // Store the secret in the appropriate user table
    // Note: We don't enable 2FA yet - user must verify first
    let updateResult;
    
    switch (userRole) {
      case 'customer':
        updateResult = await db
          .update(users)
          .set({
            twoFactorSecret: secret.base32,
            twoFactorBackupCodes: backupCodes,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        break;
        
      case 'vendor':
        updateResult = await db
          .update(vendors)
          .set({
            twoFactorSecret: secret.base32,
            twoFactorBackupCodes: backupCodes,
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, userId))
          .returning({ id: vendors.id });
        break;
        
      case 'admin':
        updateResult = await db
          .update(adminUsers)
          .set({
            twoFactorSecret: secret.base32,
            twoFactorBackupCodes: backupCodes,
            updatedAt: new Date(),
          })
          .where(eq(adminUsers.id, userId))
          .returning({ id: adminUsers.id });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid user role' },
          { status: 400 }
        );
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      backupCodes,
      secret: secret.base32, // For manual entry if QR code doesn't work
      message: 'Please scan the QR code with your authenticator app and verify with a code to complete setup',
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
