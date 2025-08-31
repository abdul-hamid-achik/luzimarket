import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { redirect } from 'next/navigation'
import { ResetPasswordClient } from '@/components/forms/reset-password-client'

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
          <ResetPasswordClient token={token} />
        </div>
      </div>
    </div>
  )
}