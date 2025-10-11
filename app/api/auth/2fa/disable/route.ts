export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { disable2FA } from '@/lib/services/auth-service';

/**
 * POST /api/auth/2fa/disable
 * 
 * Disables TOTP-based 2FA for the authenticated user.
 * Requires current password or TOTP verification for security.
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

    // Disable 2FA using AuthService
    const result = await disable2FA(
      session.user.id,
      session.user.role as any,
      session.user.email!,
      token,
      password
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
