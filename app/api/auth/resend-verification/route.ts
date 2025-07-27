export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const { email } = resendSchema.parse(body);
    
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "Si existe una cuenta con ese correo, se enviará un nuevo enlace de verificación.",
      });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Este correo electrónico ya ha sido verificado." },
        { status: 400 }
      );
    }
    
    // Check for existing unexpired token
    const existingToken = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, user.id),
          gt(emailVerificationTokens.expiresAt, new Date()),
          isNull(emailVerificationTokens.usedAt)
        )
      )
      .limit(1);
    
    if (existingToken.length > 0) {
      // Check if we should rate limit (e.g., only allow resend every 5 minutes)
      const tokenAge = new Date().getTime() - new Date(existingToken[0].createdAt!).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (tokenAge < fiveMinutes) {
        const remainingMinutes = Math.ceil((fiveMinutes - tokenAge) / 60000);
        return NextResponse.json(
          { error: `Por favor espera ${remainingMinutes} minutos antes de solicitar otro enlace.` },
          { status: 429 }
        );
      }
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry
    
    // Save verification token
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token: verificationToken,
      expiresAt,
    });
    
    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: "Verifica tu correo electrónico - LUZIMARKET",
      html: `
        <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; margin-bottom: 20px;">Verifica tu correo electrónico</h2>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hola ${user.name},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hemos recibido una solicitud para verificar tu correo electrónico en LUZIMARKET.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background-color: #000; color: #fff; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 4px;">
                Verificar correo electrónico
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
              Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
            </p>
            <p style="font-size: 14px; color: #666; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
              Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este mensaje.
            </p>
          </div>
          
          <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
          </div>
        </div>
      `,
    });
    
    return NextResponse.json({
      message: "Se ha enviado un nuevo enlace de verificación a tu correo electrónico.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Correo electrónico inválido" },
        { status: 400 }
      );
    }
    
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Error al enviar el enlace de verificación" },
      { status: 500 }
    );
  }
}