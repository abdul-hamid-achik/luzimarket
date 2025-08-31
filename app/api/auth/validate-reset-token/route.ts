import { NextRequest, NextResponse } from 'next/server'
import { validateResetToken } from '@/lib/actions/password-reset'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token requerido' },
        { status: 400 }
      )
    }
    
    const result = await validateResetToken(token)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Token validation API error:', error)
    return NextResponse.json(
      { valid: false, error: 'Error al validar el token' },
      { status: 500 }
    )
  }
}