import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // Supported locales
  locales: ['es', 'en'],
  
  // Default locale (Spanish for northern Mexico focus)
  defaultLocale: 'es',
  
  // Locale prefix configuration
  localePrefix: {
    mode: 'as-needed', // Don't show /es for default Spanish
    prefixes: {
      'es': '/', // Spanish at root
      'en': '/en' // English with prefix
    }
  },
  
  // Define localized pathnames
  pathnames: {
    '/': '/',
    '/products': {
      es: '/productos',
      en: '/products'
    },
    '/products/[id]': {
      es: '/productos/[id]',
      en: '/products/[id]'
    },
    '/category/[slug]': {
      es: '/categoria/[slug]',
      en: '/category/[slug]'
    },
    '/cart': {
      es: '/carrito',
      en: '/cart'
    },
    '/checkout': {
      es: '/pagar',
      en: '/checkout'
    },
    '/vendor/register': {
      es: '/vendedor/registro',
      en: '/vendor/register'
    },
    '/vendor/dashboard': {
      es: '/vendedor/panel',
      en: '/vendor/dashboard'
    },
    '/admin': '/admin', // Keep admin routes in English
    '/coming-soon': {
      es: '/proximamente',
      en: '/coming-soon'
    }
  }
});