'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { requestPasswordReset } from '@/lib/actions/password-reset'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('email', data.email)
      
      const result = await requestPasswordReset(formData)
      
      if (result.success) {
        setIsSuccess(true)
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Ocurrió un error')
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Revisa tu correo
        </h3>
        <p className="text-sm text-gray-600">
          Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          No olvides revisar tu carpeta de spam.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="email" className="block text-sm font-univers text-gray-700">
          Email
        </Label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            {...register('email')}
            type="email"
            id="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar enlace de restablecimiento'
        )}
      </Button>
    </form>
  )
}