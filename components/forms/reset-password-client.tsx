'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { ResetPasswordForm } from './reset-password-form'
import { XCircle, Loader2 } from 'lucide-react'

interface ResetPasswordClientProps {
  token: string
}

export function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`)
        const data = await response.json()
        
        if (data.valid) {
          setIsValid(true)
        } else {
          setError(data.error || 'Token inválido o expirado')
        }
      } catch (err) {
        setError('Error al validar el token')
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [token])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Validando enlace...</p>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="text-center py-8">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Enlace inválido o expirado
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {error || 'Este enlace de restablecimiento de contraseña ya no es válido.'}
        </p>
        <Link 
          href="/forgot-password"
          className="text-sm font-univers text-black hover:text-gray-700"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}