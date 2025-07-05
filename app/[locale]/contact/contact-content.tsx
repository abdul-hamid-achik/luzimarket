'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

export function ContactContent() {
  const t = useTranslations('Contact')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true)
    try {
      // Here you would typically send the contact form data to your backend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      toast.success(t('successMessage'))
      form.reset()
    } catch (error) {
      toast.error(t('errorMessage'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 font-heading text-4xl font-bold md:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t('contactInfo.title')}</CardTitle>
                <CardDescription>{t('contactInfo.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('contactInfo.email')}</p>
                    <a
                      href="mailto:support@luzimarket.shop"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      support@luzimarket.shop
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('contactInfo.phone')}</p>
                    <a
                      href="tel:+525555551234"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      +52 55 5555 1234
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('contactInfo.address')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('contactInfo.addressLine1')}<br />
                      {t('contactInfo.addressLine2')}<br />
                      {t('contactInfo.addressLine3')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('contactInfo.hours')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('contactInfo.hoursWeekdays')}<br />
                      {t('contactInfo.hoursWeekends')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">{t('quickLinks.title')}</h3>
                  <div className="space-y-2">
                    <Link
                      href="/faq"
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{t('quickLinks.faq')}</span>
                    </Link>
                    <Link
                      href="/orders/lookup"
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <span>{t('quickLinks.trackOrder')}</span>
                    </Link>
                    <Link
                      href="/returns"
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <span>{t('quickLinks.returns')}</span>
                    </Link>
                    <Link
                      href="/shipping"
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <span>{t('quickLinks.shipping')}</span>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('form.title')}</CardTitle>
                <CardDescription>{t('form.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.name')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('form.namePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('form.email')}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={t('form.emailPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.subject')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('form.subjectPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.message')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('form.messagePlaceholder')}
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? (
                        <>{t('form.sending')}</>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {t('form.submit')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 rounded-lg bg-muted/50 p-6 text-center">
          <h2 className="mb-3 text-xl font-semibold">{t('additionalInfo.title')}</h2>
          <p className="mx-auto max-w-3xl text-muted-foreground">
            {t('additionalInfo.description')}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="/vendor/register">
              <Button variant="outline">{t('additionalInfo.becomeVendor')}</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline">{t('additionalInfo.aboutUs')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}