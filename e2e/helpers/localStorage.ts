import { Page } from '@playwright/test';

/**
 * Safe localStorage wrapper for tests that handles security errors
 */
export async function safeLocalStorage(page: Page) {
  // Inject localStorage wrapper
  await page.addInitScript(() => {
    // Create a fallback storage in case localStorage is blocked
    const fallbackStorage: { [key: string]: string } = {};
    
    // Save original localStorage
    const originalLocalStorage = window.localStorage;
    
    // Create safe wrapper
    const safeLocalStorage = {
      getItem: (key: string): string | null => {
        try {
          return originalLocalStorage.getItem(key);
        } catch (e) {
          console.warn('localStorage.getItem failed, using fallback:', e);
          return fallbackStorage[key] || null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          originalLocalStorage.setItem(key, value);
        } catch (e) {
          console.warn('localStorage.setItem failed, using fallback:', e);
          fallbackStorage[key] = value;
        }
      },
      removeItem: (key: string): void => {
        try {
          originalLocalStorage.removeItem(key);
        } catch (e) {
          console.warn('localStorage.removeItem failed, using fallback:', e);
          delete fallbackStorage[key];
        }
      },
      clear: (): void => {
        try {
          originalLocalStorage.clear();
        } catch (e) {
          console.warn('localStorage.clear failed, using fallback:', e);
          Object.keys(fallbackStorage).forEach(key => delete fallbackStorage[key]);
        }
      },
      get length(): number {
        try {
          return originalLocalStorage.length;
        } catch (e) {
          return Object.keys(fallbackStorage).length;
        }
      },
      key: (index: number): string | null => {
        try {
          return originalLocalStorage.key(index);
        } catch (e) {
          return Object.keys(fallbackStorage)[index] || null;
        }
      }
    };
    
    // Override window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: safeLocalStorage,
      writable: false,
      configurable: true
    });
  });
}

/**
 * Set localStorage item safely in tests
 */
export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => {
    window.localStorage.setItem(k, v);
  }, [key, value]);
}

/**
 * Get localStorage item safely in tests
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => {
    return window.localStorage.getItem(k);
  }, key);
}

/**
 * Clear localStorage safely in tests
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}