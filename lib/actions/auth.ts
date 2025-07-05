"use server";

import { db } from "@/db";
import { users, vendors, adminUsers } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

const LOCKOUT_THRESHOLD = 5; // Number of failed attempts before lockout
const LOCKOUT_WINDOW_MINUTES = 15; // Time window for counting failed attempts
const LOCKOUT_DURATION_MINUTES = 30; // How long the account remains locked

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: "customer" | "vendor" | "admin";
  };
  error?: string;
  isLocked?: boolean;
  remainingAttempts?: number;
}

export async function authenticateUser(
  email: string,
  password: string,
  userType: "customer" | "vendor" | "admin"
): Promise<AuthResult> {
  try {
    let table;
    switch (userType) {
      case "customer":
        table = users;
        break;
      case "vendor":
        table = vendors;
        break;
      case "admin":
        table = adminUsers;
        break;
    }

    // Get user with lockout info
    const [user] = await db
      .select()
      .from(table)
      .where(eq(table.email, email))
      .limit(1);

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.lockedUntil).getTime() - new Date().getTime()) / (1000 * 60)
      );
      return {
        success: false,
        error: `Account is locked. Please try again in ${minutesRemaining} minutes.`,
        isLocked: true,
      };
    }

    // Check if account is active
    if (!user.isActive) {
      return { success: false, error: "Account is inactive" };
    }

    // Check if email is verified (only for customers)
    if (userType === "customer" && 'emailVerified' in user && !user.emailVerified) {
      return { success: false, error: "Por favor verifica tu correo electrónico antes de iniciar sesión." };
    }

    // Verify password
    const isValidPassword = user.passwordHash && await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Handle failed login attempt
      await handleFailedLoginAttempt(email, userType, user);
      
      const remainingAttempts = Math.max(0, LOCKOUT_THRESHOLD - ((user.failedLoginAttempts || 0) + 1));
      
      if (remainingAttempts === 0) {
        return {
          success: false,
          error: "Too many failed login attempts. Your account has been locked for 30 minutes.",
          isLocked: true,
        };
      }
      
      return {
        success: false,
        error: "Invalid credentials",
        remainingAttempts,
      };
    }

    // Reset failed attempts on successful login
    await db
      .update(table)
      .set({
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
      })
      .where(eq(table.email, email));

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: (user as any).name || (user as any).contactName || user.email,
        role: userType as "customer" | "vendor" | "admin",
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

async function handleFailedLoginAttempt(
  email: string,
  userType: "customer" | "vendor" | "admin",
  user: any
) {
  let table;
  switch (userType) {
    case "customer":
      table = users;
      break;
    case "vendor":
      table = vendors;
      break;
    case "admin":
      table = adminUsers;
      break;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - LOCKOUT_WINDOW_MINUTES * 60 * 1000);

  // Check if we need to reset the counter (outside the time window)
  let failedAttempts = user.failedLoginAttempts || 0;
  if (!user.lastFailedLoginAt || new Date(user.lastFailedLoginAt) < windowStart) {
    failedAttempts = 0;
  }

  failedAttempts++;

  const updateData: any = {
    failedLoginAttempts: failedAttempts,
    lastFailedLoginAt: now,
  };

  // Lock the account if threshold is reached
  if (failedAttempts >= LOCKOUT_THRESHOLD) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    updateData.lockedUntil = lockedUntil;

    // Send lockout notification email
    try {
      await sendAccountLockoutNotification(user.email, user.name || user.contactName || user.email);
    } catch (error) {
      console.error("Failed to send lockout notification:", error);
    }
  }

  await db
    .update(table)
    .set(updateData)
    .where(eq(table.email, email));
}

async function sendAccountLockoutNotification(email: string, name: string) {
  const html = `
    <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <h2 style="font-size: 24px; margin-bottom: 20px; color: #d10000;">Cuenta bloqueada por seguridad</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hola ${name},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión.
          Esta es una medida de seguridad para proteger tu cuenta.
        </p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="margin: 0; font-size: 16px; line-height: 1.6;">
            <strong>Tu cuenta será desbloqueada automáticamente en 30 minutos.</strong>
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Si no fuiste tú quien intentó acceder a tu cuenta, te recomendamos:
        </p>
        
        <ul style="font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
          <li>Cambiar tu contraseña inmediatamente después de que se desbloquee tu cuenta</li>
          <li>Revisar la actividad reciente de tu cuenta</li>
          <li>Contactar a nuestro equipo de soporte si notas algo sospechoso</li>
        </ul>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Si necesitas ayuda adicional, no dudes en contactarnos.
        </p>
      </div>
      
      <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px;">© 2024 LUZIMARKET</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Cuenta bloqueada temporalmente - LUZIMARKET",
    html,
  });
}

export async function unlockUserAccount(
  userId: string,
  userType: "customer" | "vendor" | "admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    let table;
    switch (userType) {
      case "customer":
        table = users;
        break;
      case "vendor":
        table = vendors;
        break;
      case "admin":
        table = adminUsers;
        break;
    }

    await db
      .update(table)
      .set({
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
      })
      .where(eq(table.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error unlocking account:", error);
    return { success: false, error: "Failed to unlock account" };
  }
}

export async function getLockedAccounts() {
  try {
    const now = new Date();

    // Get locked users from all tables
    const [lockedCustomers, lockedVendors, lockedAdmins] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          lockedUntil: users.lockedUntil,
          failedLoginAttempts: users.failedLoginAttempts,
          lastFailedLoginAt: users.lastFailedLoginAt,
        })
        .from(users)
        .where(and(
          gt(users.lockedUntil, now),
          gt(users.failedLoginAttempts, 0)
        )),
      db
        .select({
          id: vendors.id,
          email: vendors.email,
          name: vendors.contactName,
          lockedUntil: vendors.lockedUntil,
          failedLoginAttempts: vendors.failedLoginAttempts,
          lastFailedLoginAt: vendors.lastFailedLoginAt,
        })
        .from(vendors)
        .where(and(
          gt(vendors.lockedUntil, now),
          gt(vendors.failedLoginAttempts, 0)
        )),
      db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          name: adminUsers.name,
          lockedUntil: adminUsers.lockedUntil,
          failedLoginAttempts: adminUsers.failedLoginAttempts,
          lastFailedLoginAt: adminUsers.lastFailedLoginAt,
        })
        .from(adminUsers)
        .where(and(
          gt(adminUsers.lockedUntil, now),
          gt(adminUsers.failedLoginAttempts, 0)
        )),
    ]);

    return {
      customers: lockedCustomers,
      vendors: lockedVendors,
      admins: lockedAdmins,
    };
  } catch (error) {
    console.error("Error fetching locked accounts:", error);
    return {
      customers: [],
      vendors: [],
      admins: [],
    };
  }
}