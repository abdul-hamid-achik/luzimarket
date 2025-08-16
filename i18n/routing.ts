import { defineRouting } from 'next-intl/routing';

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
    '/category/[slug]/[vendor]': {
      es: '/categoria/[slug]/[vendor]',
      en: '/category/[slug]/[vendor]'
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
    '/vendor/products/[id]': {
      es: '/vendedor/productos/[id]',
      en: '/vendor/products/[id]'
    },
    '/vendor/products/new': {
      es: '/vendedor/productos/nuevo',
      en: '/vendor/products/new'
    },
    '/vendor/orders': {
      es: '/vendedor/ordenes',
      en: '/vendor/orders'
    },
    '/vendor/orders/[id]': {
      es: '/vendedor/ordenes/[id]',
      en: '/vendor/orders/[id]'
    },
    '/vendor/analytics': {
      es: '/vendedor/analiticas',
      en: '/vendor/analytics'
    },
    '/vendor/financials': {
      es: '/vendedor/finanzas',
      en: '/vendor/financials'
    },
    '/vendor/settings': {
      es: '/vendedor/configuracion',
      en: '/vendor/settings'
    },
    '/vendor/settings/shipping': {
      es: '/vendedor/configuracion/envio',
      en: '/vendor/settings/shipping'
    },
    '/vendor/settings/store': {
      es: '/vendedor/configuracion/tienda',
      en: '/vendor/settings/store'
    },
    '/vendor/settings/notifications': {
      es: '/vendedor/configuracion/notificaciones',
      en: '/vendor/settings/notifications'
    },
    '/vendor/settings/security': {
      es: '/vendedor/configuracion/seguridad',
      en: '/vendor/settings/security'
    },
    '/vendor/settings/payments': {
      es: '/vendedor/configuracion/pagos',
      en: '/vendor/settings/payments'
    },
    '/vendor/stripe-onboarding': {
      es: '/vendedor/pagos',
      en: '/vendor/stripe-onboarding'
    },
    '/admin': '/admin', // Keep admin routes in English
    '/admin/orders': '/admin/orders',
    '/admin/orders/[id]': '/admin/orders/[id]',
    '/admin/vendors': '/admin/vendors',
    '/admin/vendors/[id]': '/admin/vendors/[id]',
    '/admin/vendors/[id]/transactions': '/admin/vendors/[id]/transactions',
    '/admin/products': '/admin/products',
    '/admin/moderation/images': '/admin/moderation/images',
    '/admin/users': '/admin/users',
    '/admin/financials': '/admin/financials',
    '/admin/categories': '/admin/categories',
    '/admin/locked-accounts': '/admin/locked-accounts',
    '/admin/email-templates': '/admin/email-templates',
    '/admin/settings': '/admin/settings',
    '/coming-soon': {
      es: '/proximamente',
      en: '/coming-soon'
    },
    '/brands': {
      es: '/tiendas-marcas',
      en: '/brands'
    },
    '/brands/[slug]': {
      es: '/tiendas-marcas/[slug]',
      en: '/brands/[slug]'
    },
    '/best-sellers': {
      es: '/mas-vendidos',
      en: '/best-sellers'
    },
    '/handpicked': {
      es: '/seleccionados',
      en: '/handpicked'
    },
    '/search': {
      es: '/buscar',
      en: '/search'
    },
    '/categories': {
      es: '/categorias',
      en: '/categories'
    },
    '/occasions': {
      es: '/ocasiones',
      en: '/occasions'
    },
    '/occasions/[id]': {
      es: '/ocasiones/[id]',
      en: '/occasions/[id]'
    },
    '/editorial': {
      es: '/editorial',
      en: '/editorial'
    },
    '/editorial/[id]': {
      es: '/editorial/[id]',
      en: '/editorial/[id]'
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
    '/orders/lookup': {
      es: '/pedidos/buscar',
      en: '/orders/lookup'
    },
    '/orders': {
      es: '/pedidos',
      en: '/orders'
    },
    '/orders/[id]': {
      es: '/pedidos/[id]',
      en: '/orders/[id]'
    },
    '/orders/[orderNumber]': {
      es: '/pedidos/[orderNumber]',
      en: '/orders/[orderNumber]'
    },
    '/account': {
      es: '/account',
      en: '/account'
    },
    '/account/security': {
      es: '/account/security',
      en: '/account/security'
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