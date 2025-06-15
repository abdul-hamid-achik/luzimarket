// Helper to get localized paths and text for e2e tests

export const messages = {
  es: {
    navigation: {
      bestSellers: 'Más vendidos',
      handpicked: 'Selección Especial',
      brands: 'Tiendas + Marcas',
      categories: 'Categorías',
    },
    auth: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
    },
    cart: {
      cart: 'Carrito',
      addToCart: 'Agregar al carrito',
    },
    search: {
      search: 'Buscar',
      searchPlaceholder: 'Buscar productos...',
    },
  },
  en: {
    navigation: {
      bestSellers: 'Best Sellers',
      handpicked: 'Handpicked',
      brands: 'Shops + Brands',
      categories: 'Categories',
    },
    auth: {
      login: 'Sign in',
      logout: 'Sign out',
    },
    cart: {
      cart: 'Cart',
      addToCart: 'Add to cart',
    },
    search: {
      search: 'Search',
      searchPlaceholder: 'Search products...',
    },
  },
};

export function getMessages(locale: 'es' | 'en' = 'es') {
  return messages[locale];
}

export function getLocalizedPath(path: string, locale: 'es' | 'en' = 'es') {
  // Root path doesn't need locale prefix
  if (path === '/') return '/';
  
  // Add locale prefix if not already present
  if (!path.startsWith(`/${locale}`)) {
    return `/${locale}${path}`;
  }
  
  return path;
}