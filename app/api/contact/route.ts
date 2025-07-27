export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
})

// Simple in-memory rate limiting
const contactAttempts = new Map<string, { count: number; resetTime: number }>()

export async function POST(request: Request) {
  try {
    // Simple rate limiting based on IP
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'anonymous'
    
    const now = Date.now()
    const windowMs = 60 * 60 * 1000 // 1 hour
    const maxAttempts = 5 // 5 contact messages per hour
    
    const attempts = contactAttempts.get(identifier)
    
    if (attempts) {
      if (now < attempts.resetTime) {
        if (attempts.count >= maxAttempts) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
          )
        }
        attempts.count++
      } else {
        // Reset the window
        contactAttempts.set(identifier, { count: 1, resetTime: now + windowMs })
      }
    } else {
      contactAttempts.set(identifier, { count: 1, resetTime: now + windowMs })
    }
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [key, value] of contactAttempts.entries()) {
        if (now > value.resetTime) {
          contactAttempts.delete(key)
        }
      }
    }

    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // Send email to support team
    await sendEmail({
      to: 'support@luzimarket.shop',
      subject: `Contact Form: ${validatedData.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
      `,
    })

    // Send confirmation email to the user
    await sendEmail({
      to: validatedData.email,
      subject: 'We received your message - Luzimarket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for contacting us!</h2>
          <p>Hi ${validatedData.name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <p>Our support team typically responds within 24-48 hours during business days.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p><strong>Your message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${validatedData.message.replace(/\n/g, '<br>')}
          </p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The Luzimarket Team
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}