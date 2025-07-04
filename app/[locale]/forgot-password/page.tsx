import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'
import { ArrowLeft } from 'lucide-react'

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('Auth')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <span className="text-2xl font-times-now">LUZIMARKET</span>
          </Link>
          
          <h2 className="text-3xl font-times-now text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-univers">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm />
          
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-sm font-univers text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}