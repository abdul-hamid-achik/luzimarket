import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { redirect } from 'next/navigation'
import { validateResetToken } from '@/lib/actions/password-reset'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'
import { XCircle } from 'lucide-react'

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale } = await params
  const { token } = await searchParams
  setRequestLocale(locale)
  
  const t = await getTranslations('Auth')

  // Check if token is provided
  if (!token) {
    redirect('/forgot-password')
  }

  // Validate token
  const validation = await validateResetToken(token)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="text-2xl font-times-now">LUZIMARKET</span>
          </Link>
          
          <h2 className="text-3xl font-times-now text-gray-900">
            Nueva contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-univers">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {validation.valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="text-center py-8">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Enlace inválido o expirado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {validation.error || 'Este enlace de restablecimiento de contraseña ya no es válido.'}
              </p>
              <Link 
                href="/forgot-password"
                className="text-sm font-univers text-black hover:text-gray-700"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}