"use server";

import { db } from "@/db";
import { users, vendors, adminUsers, emailVerificationTokens, passwordResetTokens } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { sendVerificationEmail, sendPasswordResetEmail, sendAccountLockoutEmail, send2FAEnabledEmail } from "@/lib/services/email-service";
import { registerSchema, resetPasswordSchema, requestResetSchema } from "@/lib/services/validation-service";
import { convertGuestOrdersToUser } from "@/lib/actions/guest-orders";
import { logAuthEvent, logPasswordEvent } from "@/lib/audit-helpers";
import { AuditLogger } from "@/lib/middleware/security";

/**
 * AuthService
 * Centralized authentication service handling:
 * - User registration
 * - Email verification
 * - Password reset
 * - 2FA (setup, verify, disable)
 * - Authentication & lockout logic
 */

type UserType = "customer" | "vendor" | "admin";

interface AuthResult {
    success: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        role: UserType;
    };
    error?: string;
    isLocked?: boolean;
    remainingAttempts?: number;
}

interface RegistrationResult {
    success: boolean;
    user?: {
        id: string;
        name: string;
        email: string;
    };
    message?: string;
    error?: string;
    guestOrdersConverted?: number;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MINUTES = 15;
const LOCKOUT_DURATION_MINUTES = 30;

// ============================================================================
// REGISTRATION & EMAIL VERIFICATION
// ============================================================================

export async function registerUser(data: unknown): Promise<RegistrationResult> {
    try {
        // Validate input
        const validatedData = registerSchema.parse(data);

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, validatedData.email),
        });

        if (existingUser) {
            return {
                success: false,
                error: "El correo electrónico ya está registrado",
            };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                name: validatedData.name,
                email: validatedData.email,
                passwordHash: hashedPassword,
                emailVerified: false,
            })
            .returning();

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

        // Save verification token
        await db.insert(emailVerificationTokens).values({
            userId: newUser.id,
            token: verificationToken,
            expiresAt,
        });

        // Send verification email
        await sendVerificationEmail(
            { email: newUser.email, name: newUser.name },
            verificationToken
        );

        // Convert any guest orders to this new user account
        const conversionResult = await convertGuestOrdersToUser({
            userId: newUser.id,
            email: newUser.email,
        });

        // Log registration event
        await logAuthEvent({
            action: 'registration',
            userId: newUser.id,
            userEmail: newUser.email,
            userType: 'customer',
            details: {
                name: newUser.name,
                emailVerified: false,
                guestOrdersConverted: conversionResult.convertedCount || 0,
            },
        });

        return {
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            },
            message: "Cuenta creada exitosamente. Por favor verifica tu correo electrónico.",
            guestOrdersConverted: conversionResult.convertedCount || 0,
        };
    } catch (error: any) {
        console.error("Registration error:", error);
        return {
            success: false,
            error: error.message || "Error al crear la cuenta",
        };
    }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Find the verification token
        const [verificationToken] = await db
            .select()
            .from(emailVerificationTokens)
            .where(
                and(
                    eq(emailVerificationTokens.token, token),
                    gt(emailVerificationTokens.expiresAt, new Date()),
                    isNull(emailVerificationTokens.usedAt)
                )
            )
            .limit(1);

        if (!verificationToken) {
            return { success: false, error: "Token inválido o expirado" };
        }

        // Mark token as used
        await db
            .update(emailVerificationTokens)
            .set({ usedAt: new Date() })
            .where(eq(emailVerificationTokens.id, verificationToken.id));

        // Update user as verified
        await db
            .update(users)
            .set({
                emailVerified: true,
                emailVerifiedAt: new Date(),
            })
            .where(eq(users.id, verificationToken.userId));

        // Get user details for audit log
        const [verifiedUser] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, verificationToken.userId))
            .limit(1);

        // Log email verification event
        if (verifiedUser) {
            await logAuthEvent({
                action: 'email_verification',
                userId: verificationToken.userId,
                userEmail: verifiedUser.email,
                userType: 'customer',
                details: {
                    verifiedAt: new Date().toISOString(),
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Email verification error:", error);
        return { success: false, error: "Error al verificar el correo electrónico" };
    }
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const validatedData = requestResetSchema.parse({ email });

        // Find user by email
        const user = await db.query.users.findFirst({
            where: eq(users.email, validatedData.email),
        });

        // Always return success to prevent email enumeration
        if (!user || !user.isActive) {
            return {
                success: true,
                message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
            };
        }

        // Delete any existing reset tokens for this user
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

        // Generate new token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

        // Save token to database
        await db.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt,
        });

        // Send reset email
        await sendPasswordResetEmail(
            { email: user.email, name: user.name },
            token
        );

        return {
            success: true,
            message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
        };
    } catch (error: any) {
        console.error('Password reset request error:', error);
        return {
            success: false,
            error: error.message || 'Ocurrió un error. Por favor, intenta de nuevo.',
        };
    }
}

export async function resetPassword(token: string, password: string, confirmPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const validatedData = resetPasswordSchema.parse({ token, password, confirmPassword });

        // Validate token
        const resetToken = await db.query.passwordResetTokens.findFirst({
            where: and(
                eq(passwordResetTokens.token, validatedData.token),
                gt(passwordResetTokens.expiresAt, new Date())
            ),
        });

        if (!resetToken || resetToken.usedAt) {
            return { success: false, error: 'Token inválido o expirado' };
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(validatedData.password, 10);

        // Update user password
        await db
            .update(users)
            .set({
                passwordHash,
                updatedAt: new Date(),
            })
            .where(eq(users.id, resetToken.userId));

        // Mark token as used
        await db
            .update(passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(passwordResetTokens.id, resetToken.id));

        // Get user details for audit log
        const [user] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, resetToken.userId))
            .limit(1);

        // Log password reset event
        if (user) {
            await logPasswordEvent({
                action: 'password_reset',
                userId: resetToken.userId,
                userEmail: user.email,
                userType: 'user',
                details: {
                    resetAt: new Date().toISOString(),
                },
            });
        }

        return {
            success: true,
            message: 'Tu contraseña ha sido actualizada exitosamente.',
        };
    } catch (error: any) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: error.message || 'Ocurrió un error al restablecer tu contraseña.',
        };
    }
}

// ============================================================================
// 2FA MANAGEMENT
// ============================================================================

export async function enable2FA(userId: string, userType: UserType, userEmail: string): Promise<{
    success: boolean;
    qrCode?: string;
    backupCodes?: string[];
    secret?: string;
    message?: string;
    error?: string;
}> {
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

        // Generate TOTP secret
        const secret = speakeasy.generateSecret({
            name: `LuziMarket (${userEmail})`,
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
        const updateResult = await db
            .update(table)
            .set({
                twoFactorSecret: secret.base32,
                twoFactorBackupCodes: backupCodes,
                updatedAt: new Date(),
            })
            .where(eq(table.id, userId))
            .returning({ id: table.id });

        if (!updateResult || updateResult.length === 0) {
            return { success: false, error: 'Failed to update user' };
        }

        // Log 2FA setup initiated
        await logAuthEvent({
            action: '2fa_enabled',
            userId,
            userEmail,
            userType,
            details: {
                setupInitiated: true,
                verified: false,
                backupCodesGenerated: backupCodes.length,
            },
        });

        return {
            success: true,
            qrCode: qrCodeDataURL,
            backupCodes,
            secret: secret.base32,
            message: 'Please scan the QR code with your authenticator app and verify with a code to complete setup',
        };
    } catch (error) {
        console.error('2FA enable error:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function verify2FA(userId: string, userType: UserType, userEmail: string, token: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
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

        // Get user's current 2FA secret
        const [userData] = await db
            .select({
                twoFactorSecret: table.twoFactorSecret,
                twoFactorEnabled: table.twoFactorEnabled,
            })
            .from(table)
            .where(eq(table.id, userId))
            .limit(1);

        if (!userData || !userData.twoFactorSecret) {
            return {
                success: false,
                error: '2FA setup not initiated. Please start the setup process first.',
            };
        }

        // Verify the TOTP token
        const verified = speakeasy.totp.verify({
            secret: userData.twoFactorSecret,
            encoding: 'base32',
            token: token.replace(/\s/g, ''),
            window: 2,
        });

        if (!verified) {
            return {
                success: false,
                error: 'Invalid verification code. Please try again.',
            };
        }

        // Enable 2FA for the user
        const updateResult = await db
            .update(table)
            .set({
                twoFactorEnabled: true,
                updatedAt: new Date(),
            })
            .where(eq(table.id, userId))
            .returning({ id: table.id });

        if (!updateResult || updateResult.length === 0) {
            return { success: false, error: 'Failed to enable 2FA' };
        }

        // Log 2FA verification success
        await logAuthEvent({
            action: '2fa_verified',
            userId,
            userEmail,
            userType,
            details: {
                verifiedAt: new Date().toISOString(),
                twoFactorEnabled: true,
            },
        });

        // Send confirmation email
        await send2FAEnabledEmail({ email: userEmail, name: userEmail });

        return {
            success: true,
            message: 'Two-factor authentication has been successfully enabled!',
        };
    } catch (error) {
        console.error('2FA verify error:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function disable2FA(
    userId: string,
    userType: UserType,
    userEmail: string,
    verificationToken?: string,
    password?: string
): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        if (!verificationToken && !password) {
            return {
                success: false,
                error: 'Either TOTP token or password is required to disable 2FA',
            };
        }

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

        // Get user's current 2FA status and credentials
        const [userData] = await db
            .select({
                twoFactorSecret: table.twoFactorSecret,
                twoFactorEnabled: table.twoFactorEnabled,
                passwordHash: table.passwordHash,
            })
            .from(table)
            .where(eq(table.id, userId))
            .limit(1);

        if (!userData) {
            return { success: false, error: 'User not found' };
        }

        if (!userData.twoFactorEnabled) {
            return { success: false, error: '2FA is not currently enabled' };
        }

        // Verify authentication method
        let isVerified = false;

        if (verificationToken && userData.twoFactorSecret) {
            isVerified = speakeasy.totp.verify({
                secret: userData.twoFactorSecret,
                encoding: 'base32',
                token: verificationToken.replace(/\s/g, ''),
                window: 2,
            });
        } else if (password && userData.passwordHash) {
            isVerified = await bcrypt.compare(password, userData.passwordHash);
        }

        if (!isVerified) {
            return {
                success: false,
                error: 'Invalid verification. Please check your token or password.',
            };
        }

        // Disable 2FA and clear secrets
        const updateResult = await db
            .update(table)
            .set({
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: [],
                updatedAt: new Date(),
            })
            .where(eq(table.id, userId))
            .returning({ id: table.id });

        if (!updateResult || updateResult.length === 0) {
            return { success: false, error: 'Failed to disable 2FA' };
        }

        // Log 2FA disabled event
        await logAuthEvent({
            action: '2fa_disabled',
            userId,
            userEmail,
            userType,
            details: {
                disabledAt: new Date().toISOString(),
                verificationMethod: verificationToken ? 'totp' : 'password',
            },
            severity: 'warning',
        });

        return {
            success: true,
            message: 'Two-factor authentication has been successfully disabled.',
        };
    } catch (error) {
        console.error('2FA disable error:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// ============================================================================
// AUTHENTICATION & LOCKOUT
// ============================================================================

export async function authenticateUser(
    email: string,
    password: string,
    userType: UserType,
    ip?: string
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
            return { success: false, error: "Credenciales inválidas" };
        }

        // Check if account is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesRemaining = Math.ceil(
                (new Date(user.lockedUntil).getTime() - new Date().getTime()) / (1000 * 60)
            );
            return {
                success: false,
                error: `Cuenta bloqueada. Intenta de nuevo en ${minutesRemaining} minutos.`,
                isLocked: true,
            };
        }

        // Check if account is active
        if (!user.isActive) {
            return { success: false, error: "Cuenta inactiva" };
        }

        // Check if email is verified (only for customers)
        if (userType === "customer" && 'emailVerified' in user && !user.emailVerified) {
            return { success: false, error: "Debes verificar tu correo electrónico" };
        }

        // Verify password
        const isValidPassword = user.passwordHash && await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            await handleFailedLoginAttempt(user.id, email, userType, table);

            const remainingAttempts = Math.max(0, LOCKOUT_THRESHOLD - ((user.failedLoginAttempts || 0) + 1));

            if (remainingAttempts === 0) {
                return {
                    success: false,
                    error: "Demasiados intentos fallidos. Cuenta bloqueada temporalmente.",
                    isLocked: true,
                };
            }

            return {
                success: false,
                error: "Credenciales inválidas",
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

        // Log successful login
        await AuditLogger.log({
            action: "login.success",
            category: "auth",
            severity: "info",
            userId: user.id,
            userType: userType,
            userEmail: user.email,
            ip: ip || "unknown",
            resourceType: "user",
            resourceId: user.id,
            details: {
                loginMethod: "password",
                userType: userType,
            },
        });

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: (user as any).name || (user as any).contactName || user.email,
                role: userType,
            },
        };
    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, error: "Error de autenticación" };
    }
}

async function handleFailedLoginAttempt(
    userId: string,
    email: string,
    userType: UserType,
    table: any
): Promise<void> {
    try {
        const [user] = await db.select().from(table).where(eq(table.id, userId)).limit(1);

        if (!user) return;

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
                await sendAccountLockoutEmail(
                    { email: user.email, name: (user as any).name || (user as any).contactName || user.email },
                    LOCKOUT_DURATION_MINUTES
                );
            } catch (error) {
                console.error("Failed to send lockout notification:", error);
            }
        }

        await db.update(table).set(updateData).where(eq(table.email, email));

        // Log failed login attempt
        await AuditLogger.log({
            action: failedAttempts >= LOCKOUT_THRESHOLD ? "login.locked" : "login.failed",
            category: "security",
            severity: failedAttempts >= LOCKOUT_THRESHOLD ? "warning" : "info",
            userId: user.id,
            userType: userType,
            userEmail: user.email,
            ip: "unknown",
            resourceType: "user",
            resourceId: user.id,
            details: {
                failedAttempts: failedAttempts,
                accountLocked: failedAttempts >= LOCKOUT_THRESHOLD,
                userType: userType,
            },
        });
    } catch (error) {
        console.error("Error handling failed login attempt:", error);
    }
}

export async function unlockUserAccount(userId: string, userType: UserType): Promise<{ success: boolean; error?: string }> {
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

