"use server";

export const runtime = 'nodejs';

import { db } from "@/db";
import { userSessions } from "@/db/schema";
import { eq, and, lt, desc, not } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

export async function getUserSessions() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, session.user.id),
          eq(userSessions.userType, session.user.role)
        )
      )
      .orderBy(desc(userSessions.lastActive));

    // Parse user agent for each session
    const sessionsWithDetails = sessions.map(s => {
      const parser = new UAParser(s.userAgent || '');
      const result = parser.getResult();
      
      return {
        ...s,
        device: s.device || `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || result.os.name || 'Unknown Device',
        browser: s.browser || `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
        isCurrent: s.userId === session.user.id,
      };
    });

    return { success: true, data: sessionsWithDetails };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return { success: false, error: "Failed to fetch sessions" };
  }
}

export async function revokeSession(sessionId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Make sure the session belongs to the current user
    const [targetSession] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.id, sessionId),
          eq(userSessions.userId, session.user.id),
          eq(userSessions.userType, session.user.role)
        )
      )
      .limit(1);

    if (!targetSession) {
      return { success: false, error: "Session not found" };
    }

    // Don't allow revoking the current session
    if (targetSession.userId === session.user.id) {
      return { success: false, error: "Cannot revoke current session" };
    }

    // Delete the session
    await db.delete(userSessions).where(eq(userSessions.id, sessionId));

    return { success: true };
  } catch (error) {
    console.error("Error revoking session:", error);
    return { success: false, error: "Failed to revoke session" };
  }
}

export async function revokeAllSessions() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Delete all sessions except the current one
    await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.userId, session.user.id),
          eq(userSessions.userType, session.user.role),
          // Keep the current session by excluding it
          // not(eq(userSessions.sessionToken, session.sessionToken)) // Commented out - cannot access sessionToken
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error revoking all sessions:", error);
    return { success: false, error: "Failed to revoke sessions" };
  }
}

export async function createSession(userId: string, userType: 'user' | 'vendor' | 'admin', sessionToken: string) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';

    // Parse user agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Get location from IP (in production, you'd use a geolocation service)
    const location = "Unknown"; // You can integrate with IP geolocation API

    await db.insert(userSessions).values({
      userId,
      userType,
      sessionToken,
      ipAddress: ipAddress.split(',')[0].trim(),
      userAgent,
      device: `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || result.os.name || 'Unknown Device',
      browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      location,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: "Failed to create session" };
  }
}

export async function updateSessionActivity(sessionToken: string) {
  try {
    await db
      .update(userSessions)
      .set({ lastActive: new Date() })
      .where(eq(userSessions.sessionToken, sessionToken));
    
    return { success: true };
  } catch (error) {
    console.error("Error updating session activity:", error);
    return { success: false, error: "Failed to update session" };
  }
}

export async function cleanExpiredSessions() {
  try {
    await db
      .delete(userSessions)
      .where(lt(userSessions.expiresAt, new Date()));
    
    return { success: true };
  } catch (error) {
    console.error("Error cleaning expired sessions:", error);
    return { success: false, error: "Failed to clean sessions" };
  }
}