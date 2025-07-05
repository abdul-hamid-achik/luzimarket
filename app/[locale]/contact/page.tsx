import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ContactContent } from './contact-content'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })

  return <ContactContent />
}