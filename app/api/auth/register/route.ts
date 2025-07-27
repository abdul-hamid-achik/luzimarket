export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { convertGuestOrdersToUser } from "@/lib/actions/guest-orders";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, validatedData.email),
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user (not verified by default)
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || '3000'}`;
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: newUser.email,
      subject: "Verifica tu correo electrónico - LUZIMARKET",
      html: `
        <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2 style="font-size: 24px; margin-bottom: 20px;">¡Bienvenido ${validatedData.name}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Gracias por registrarte en LUZIMARKET. Para completar tu registro, por favor verifica tu correo electrónico.
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
              Este enlace expirará en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.
            </p>
          </div>
          
          <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
          </div>
        </div>
      `,
    });
    
    // Convert any guest orders to this new user account
    const conversionResult = await convertGuestOrdersToUser({
      userId: newUser.id,
      email: newUser.email,
    });
    
    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      message: "Cuenta creada exitosamente. Por favor verifica tu correo electrónico.",
      guestOrdersConverted: conversionResult.convertedCount || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}