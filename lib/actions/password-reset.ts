'use server'

import { z } from 'zod'
import { db } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

// Schema for requesting password reset
const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
})

// Schema for resetting password
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Generate a secure random token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Request password reset
export async function requestPasswordReset(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData)
    const validatedData = requestResetSchema.parse(rawData)
    
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)
    
    // Always return success to prevent email enumeration
    if (!user || user.length === 0) {
      return {
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      }
    }
    
    const foundUser = user[0]
    
    // Check if user is active
    if (!foundUser.isActive) {
      return {
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      }
    }
    
    // Delete any existing reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, foundUser.id))
    
    // Generate new token
    const token = generateResetToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour
    
    // Save token to database
    await db.insert(passwordResetTokens).values({
      userId: foundUser.id,
      token,
      expiresAt,
    })
    
    // Send reset email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || '3000'}`
    const resetUrl = `${appUrl}/reset-password?token=${token}`
    
    try {
      await sendEmail({
        to: foundUser.email,
        subject: 'Restablecer tu contraseña - LUZIMARKET',
        html: `
          <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="font-size: 24px; margin-bottom: 20px;">Restablecer tu contraseña</h2>
              
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hola ${foundUser.name},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú quien realizó esta solicitud, puedes ignorar este correo.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background-color: #000; color: #fff; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 4px;">
                  Restablecer contraseña
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
                Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
              </p>
              <p style="font-size: 14px; color: #666; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
                Este enlace expirará en 1 hora por razones de seguridad.
              </p>
            </div>
            
            <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
            </div>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Error sending reset email:', emailError)
      // Don't reveal email sending failed
    }
    
    return {
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }
    
    console.error('Password reset request error:', error)
    return {
      success: false,
      error: 'Ocurrió un error. Por favor, intenta de nuevo.',
    }
  }
}

// Validate reset token
export async function validateResetToken(token: string) {
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

// Reset password with token
export async function resetPassword(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData)
    const validatedData = resetPasswordSchema.parse(rawData)
    
    // Validate token
    const tokenValidation = await validateResetToken(validatedData.token)
    if (!tokenValidation.valid) {
      return {
        success: false,
        error: tokenValidation.error,
      }
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(validatedData.password, 10)
    
    // Update user password
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenValidation.userId!))
    
    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordResetTokens.token, validatedData.token))
    
    return {
      success: true,
      message: 'Tu contraseña ha sido actualizada exitosamente.',
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }
    
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'Ocurrió un error al restablecer tu contraseña.',
    }
  }
}