import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // Supported locales
  locales: ['es', 'en'],
  
  // Default locale (Spanish for northern Mexico focus)
  defaultLocale: 'es',
  
  // Locale prefix configuration
  localePrefix: 'always', // Always show locale in URL
  
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
    '/vendor/products': {
      es: '/vendedor/productos',
      en: '/vendor/products'
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
    },
    '/register': {
      es: '/registrarse',
      en: '/register'
    },
    '/forgot-password': {
      es: '/olvide-contrasena',
      en: '/forgot-password'
    },
    '/reset-password': {
      es: '/restablecer-contrasena',
      en: '/reset-password'
    },
    '/resend-verification': {
      es: '/reenviar-verificacion',
      en: '/resend-verification'
    },
    '/orders': {
      es: '/pedidos',
      en: '/orders'
    },
    '/orders/[id]': {
      es: '/pedidos/[id]',
      en: '/orders/[id]'
    },
    '/about': {
      es: '/acerca-de',
      en: '/about'
    },
    '/contact': {
      es: '/contacto',
      en: '/contact'
    },
    '/terms': {
      es: '/terminos',
      en: '/terms'
    },
    '/privacy': {
      es: '/privacidad',
      en: '/privacy'
    }
  }
});