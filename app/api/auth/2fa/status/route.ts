import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, vendors, adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/auth/2fa/status
 * 
 * Returns the current 2FA status for the authenticated user.
 * Used by the UI to determine whether to show enable/disable options.
 * 
 * Response: { enabled: boolean, hasSecret: boolean }
 */
export async function GET(request: NextRequest) {
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
    
    // Get user's current 2FA status
    let userData;
    
    switch (userRole) {
      case 'customer':
        const [customerData] = await db
          .select({
            twoFactorEnabled: users.twoFactorEnabled,
            twoFactorSecret: users.twoFactorSecret,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        userData = customerData;
        break;
        
      case 'vendor':
        const [vendorData] = await db
          .select({
            twoFactorEnabled: vendors.twoFactorEnabled,
            twoFactorSecret: vendors.twoFactorSecret,
          })
          .from(vendors)
          .where(eq(vendors.id, userId))
          .limit(1);
        userData = vendorData;
        break;
        
      case 'admin':
        const [adminData] = await db
          .select({
            twoFactorEnabled: adminUsers.twoFactorEnabled,
            twoFactorSecret: adminUsers.twoFactorSecret,
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

    return NextResponse.json({
      enabled: userData.twoFactorEnabled || false,
      hasSecret: !!userData.twoFactorSecret,
    });

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
