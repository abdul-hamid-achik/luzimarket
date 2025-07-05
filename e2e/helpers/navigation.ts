/**
 * Helper functions for locale-aware navigation in tests
 */

// Spanish routes (with /es prefix for consistency)
export const routes = {
  home: '/es',
  login: '/es/iniciar-sesion',
  register: '/es/register',
  products: '/es/productos',
  cart: '/es/carrito',
  checkout: '/es/pagar',
  categories: '/es/categorias',
  vendorRegister: '/vendor/register', // Vendor routes are not internationalized
  vendorDashboard: '/vendor/dashboard',
  vendorProducts: '/vendor/products',
  admin: '/admin', // Admin routes are not internationalized
  adminOrders: '/admin/orders',
  adminVendors: '/admin/vendors',
  adminProducts: '/admin/products',
  adminProductsPending: '/admin/products/pending',
  adminUsers: '/admin/users',
  wishlist: '/es/favoritos',
  bestSellers: '/es/mas-vendidos',
  handpicked: '/es/seleccionados',
  brands: '/es/tiendas-marcas',
  occasions: '/es/ocasiones',
  editorial: '/es/editorial'
};

// English routes (with /en prefix)
export const enRoutes = {
  home: '/en',
  login: '/en/login',
  register: '/en/register',
  products: '/en/products',
  cart: '/en/cart',
  checkout: '/en/checkout',
  categories: '/en/categories',
  vendorRegister: '/vendor/register', // Vendor routes are not internationalized
  vendorDashboard: '/vendor/dashboard',
  vendorProducts: '/vendor/products',
  admin: '/admin', // Admin routes are not internationalized
  adminOrders: '/admin/orders',
  adminVendors: '/admin/vendors',
  adminProducts: '/admin/products',
  adminProductsPending: '/admin/products/pending',
  adminUsers: '/admin/users',
  wishlist: '/en/wishlist',
  bestSellers: '/en/best-sellers',
  handpicked: '/en/handpicked',
  brands: '/en/brands',
  occasions: '/en/occasions',
  editorial: '/en/editorial'
};

// Helper to get route based on locale
export function getRoute(routeName: keyof typeof routes, locale: 'es' | 'en' = 'es') {
  return locale === 'es' ? routes[routeName] : enRoutes[routeName];
}

// Common UI text that could be used in tests
export const uiText = {
  es: {
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    register: 'Registrarse',
    vendorTab: 'Vendedor',
    customerTab: 'Cliente',
    adminTab: 'Admin',
    email: 'Correo electrónico',
    password: 'Contraseña',
    invalidCredentials: 'Credenciales inválidas',
    addToCart: 'Agregar al carrito',
    checkout: 'Pagar',
    searchPlaceholder: 'Buscar productos, categorías o tiendas...'
  },
  en: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    vendorTab: 'Vendor',
    customerTab: 'Customer',
    adminTab: 'Admin',
    email: 'Email',
    password: 'Password',
    invalidCredentials: 'Invalid credentials',
    addToCart: 'Add to cart',
    checkout: 'Checkout',
    searchPlaceholder: 'Search products, categories or stores...'
  }
};