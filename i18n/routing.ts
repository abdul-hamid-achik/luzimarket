import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // Supported locales
  locales: ['es', 'en'],
  
  // Default locale (Spanish for northern Mexico focus)
  defaultLocale: 'es',
  
  // Locale prefix configuration
  localePrefix: 'as-needed', // Spanish URLs won't have /es prefix
  
  // Define localized pathnames
  pathnames: {
    '/': '/',
    '/products': {
      es: '/productos',
      en: '/products'
    },
    '/products/[slug]': {
      es: '/productos/[slug]',
      en: '/products/[slug]'
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
    },
    '/brands': {
      es: '/tiendas-marcas',
      en: '/brands'
    },
    '/best-sellers': {
      es: '/mas-vendidos',
      en: '/best-sellers'
    },
    '/handpicked': {
      es: '/seleccionados',
      en: '/handpicked'
    },
    '/categories': {
      es: '/categorias',
      en: '/categories'
    },
    '/occasions': {
      es: '/ocasiones',
      en: '/occasions'
    },
    '/editorial': {
      es: '/editorial',
      en: '/editorial'
    },
    '/wishlist': {
      es: '/favoritos',
      en: '/wishlist'
    },
    '/login': {
      es: '/iniciar-sesion',
      en: '/login'
    }
  }
});