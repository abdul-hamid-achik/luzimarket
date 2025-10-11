export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enable2FA } from '@/lib/services/auth-service';

/**
 * POST /api/auth/2fa/enable
 * 
 * Enables TOTP-based 2FA for the authenticated user.
 * Generates a secret key and QR code for authenticator app setup.
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

    // Enable 2FA using AuthService
    const result = await enable2FA(
      session.user.id,
      session.user.role as any,
      session.user.email!
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
      secret: result.secret,
      message: result.message,
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
