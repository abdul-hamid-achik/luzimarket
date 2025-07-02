/**
 * Helper to load and use i18n messages in tests
 */

import esMessages from '../../messages/es.json';
import enMessages from '../../messages/en.json';

export const messages = {
  es: esMessages,
  en: enMessages
} as const;

// Helper function to get a message by path
export function getMessage(locale: 'es' | 'en', path: string): string {
  const parts = path.split('.');
  let current: any = messages[locale];
  
  for (const part of parts) {
    if (current[part] === undefined) {
      throw new Error(`Message not found: ${path} in ${locale}`);
    }
    current = current[part];
  }
  
  return current;
}

// Commonly used messages for tests
export const testMessages = {
  es: {
    // Common
    login: getMessage('es', 'Common.login'),
    logout: getMessage('es', 'Common.logout'), 
    register: getMessage('es', 'Common.register'),
    cart: getMessage('es', 'Common.cart'),
    search: getMessage('es', 'Common.search'),
    account: getMessage('es', 'Common.account'),
    myOrders: getMessage('es', 'Common.myOrders'),
    
    // Navigation
    categories: getMessage('es', 'Navigation.categories'),
    products: getMessage('es', 'Navigation.products'),
    
    // Product related
    addToCart: getMessage('es', 'Products.addToCart'),
    vendor: getMessage('es', 'Products.vendor'),
  },
  en: {
    // Common
    login: getMessage('en', 'Common.login'),
    logout: getMessage('en', 'Common.logout'),
    register: getMessage('en', 'Common.register'), 
    cart: getMessage('en', 'Common.cart'),
    search: getMessage('en', 'Common.search'),
    account: getMessage('en', 'Common.account'),
    myOrders: getMessage('en', 'Common.myOrders'),
    
    // Navigation  
    categories: getMessage('en', 'Navigation.categories'),
    products: getMessage('en', 'Navigation.products'),
    
    // Product related
    addToCart: getMessage('en', 'Products.addToCart'),
    vendor: getMessage('en', 'Products.vendor'),
  }
};