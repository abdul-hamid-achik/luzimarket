/**
 * Get the application URL based on environment
 * Supports custom PORT environment variable
 */
export function getAppUrl(): string {
  // In production or if NEXT_PUBLIC_APP_URL is set, use that
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In development, use localhost with the configured port
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

/**
 * Get the base URL for API routes
 */
export function getApiUrl(): string {
  return getAppUrl();
}