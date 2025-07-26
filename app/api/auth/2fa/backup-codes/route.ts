import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, vendors, adminUsers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * GET /api/auth/2fa/backup-codes
 * 
 * Returns the current backup codes for the authenticated user.
 * Only works if 2FA is enabled.
 * 
 * POST /api/auth/2fa/backup-codes
 * 
 * Regenerates backup codes for the authenticated user.
 * Only works if 2FA is enabled.
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
    
    // Get user's current backup codes
    let userData;
    
    switch (userRole) {
      case 'customer':
        const [customerData] = await db
          .select({
            twoFactorEnabled: users.twoFactorEnabled,
            twoFactorBackupCodes: users.twoFactorBackupCodes,
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
            twoFactorBackupCodes: vendors.twoFactorBackupCodes,
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
            twoFactorBackupCodes: adminUsers.twoFactorBackupCodes,
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
        { error: '2FA must be enabled to view backup codes' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      backupCodes: userData.twoFactorBackupCodes || [],
    });

  } catch (error) {
    console.error('2FA backup codes GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    // Check if 2FA is enabled
    let userData;
    
    switch (userRole) {
      case 'customer':
        const [customerData] = await db
          .select({
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

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userData.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA must be enabled to regenerate backup codes' },
        { status: 400 }
      );
    }

    // Generate new backup codes
    const newBackupCodes = Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Update backup codes in database
    let updateResult;
    
    switch (userRole) {
      case 'customer':
        updateResult = await db
          .update(users)
          .set({
            twoFactorBackupCodes: newBackupCodes,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({ id: users.id });
        break;
        
      case 'vendor':
        updateResult = await db
          .update(vendors)
          .set({
            twoFactorBackupCodes: newBackupCodes,
            updatedAt: new Date(),
          })
          .where(eq(vendors.id, userId))
          .returning({ id: vendors.id });
        break;
        
      case 'admin':
        updateResult = await db
          .update(adminUsers)
          .set({
            twoFactorBackupCodes: newBackupCodes,
            updatedAt: new Date(),
          })
          .where(eq(adminUsers.id, userId))
          .returning({ id: adminUsers.id });
        break;
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to regenerate backup codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      backupCodes: newBackupCodes,
      message: 'Backup codes have been regenerated. Please store them securely.',
    });

  } catch (error) {
    console.error('2FA backup codes POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
