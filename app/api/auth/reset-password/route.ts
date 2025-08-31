import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/actions/password-reset'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert to FormData for the action
    const formData = new FormData()
    formData.append('token', body.token)
    formData.append('password', body.password)
    formData.append('confirmPassword', body.confirmPassword)
    
    const result = await resetPassword(formData)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Password reset API error:', error)
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al restablecer tu contraseña' },
      { status: 500 }
    )
  }
}