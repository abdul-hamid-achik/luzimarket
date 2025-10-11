import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/services/auth-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Request password reset using AuthService
    const result = await requestPasswordReset(body.email)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    })
  } catch (error) {
    console.error('Password reset request API error:', error)
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error inesperado' },
      { status: 500 }
    )
  }
}