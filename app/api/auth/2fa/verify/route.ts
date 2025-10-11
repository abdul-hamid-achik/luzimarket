export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verify2FA } from '@/lib/services/auth-service';

/**
 * POST /api/auth/2fa/verify
 * 
 * Verifies a TOTP code and completes 2FA setup.
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

    // Verify 2FA using AuthService
    const result = await verify2FA(
      session.user.id,
      session.user.role as any,
      session.user.email!,
      token
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
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
