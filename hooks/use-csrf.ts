'use client'

import { useState, useEffect } from 'react'
import { getClientCsrfToken } from '@/lib/csrf'

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    // Get CSRF token on mount
    const token = getClientCsrfToken()
    setCsrfToken(token)
  }, [])

  // Helper to add CSRF token to fetch requests
  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
      headers.set('x-csrf-token', csrfToken)
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensure cookies are sent
    })
  }

  // Helper to add CSRF token to forms
  const getCsrfInput = () => {
    if (!csrfToken) return null
    
    return (
      <input type="hidden" name="csrfToken" value={csrfToken} />
    )
  }

  return {
    csrfToken,
    secureFetch,
    getCsrfInput,
  }
}

// Hook for use with react-hook-form
export function useCsrfForm() {
  const { csrfToken } = useCsrf()
  
  return {
    defaultValues: {
      csrfToken: csrfToken || '',
    },
    // Add CSRF token to form data before submission
    transformData: (data: any) => ({
      ...data,
      csrfToken: csrfToken || '',
    }),
  }
}