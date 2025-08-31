import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/actions/password-reset'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert to FormData for the action
    const formData = new FormData()
    formData.append('email', body.email)
    
    const result = await requestPasswordReset(formData)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Password reset request API error:', error)
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error inesperado' },
      { status: 500 }
    )
  }
}