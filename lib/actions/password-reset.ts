'use server'

/**
 * Password Reset Actions
 * These actions now delegate to AuthService for consistency
 * Kept for backward compatibility with existing components
 */

import {
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService
} from '@/lib/services/auth-service'

// Request password reset - delegates to AuthService
export async function requestPasswordReset(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData)
    return await requestPasswordResetService(rawData.email as string);
  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      success: false,
      error: 'Ocurrió un error. Por favor, intenta de nuevo.',
    }
  }
}

// Reset password with token - delegates to AuthService
export async function resetPassword(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData)
    return await resetPasswordService(
      rawData.token as string,
      rawData.password as string,
      rawData.confirmPassword as string
    );
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'Ocurrió un error al restablecer tu contraseña.',
    }
  }
}

// Validate reset token - kept for backward compatibility
export async function validateResetToken(token: string) {
  // This could be moved to AuthService if needed
  const { db } = await import('@/db')
  const { passwordResetTokens } = await import('@/db/schema')
  const { eq, and, gt } = await import('drizzle-orm')

  try {
    const resetToken = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!resetToken || resetToken.length === 0 || resetToken[0].usedAt) {
      return {
        valid: false,
        error: 'Token inválido o expirado',
      }
    }

    return {
      valid: true,
      userId: resetToken[0].userId,
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return {
      valid: false,
      error: 'Error al validar el token',
    }
  }
}