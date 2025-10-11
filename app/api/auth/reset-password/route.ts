import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/services/auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Reset password using AuthService
    const result = await resetPassword(body.token, body.password, body.confirmPassword)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    })
  } catch (error) {
    console.error('Password reset API error:', error)
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al restablecer tu contraseña' },
      { status: 500 }
    )
  }
}