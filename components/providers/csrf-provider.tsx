import { cookies } from 'next/headers'

export async function CsrfProvider({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const csrfToken = cookieStore.get('csrf-token')?.value

  return (
    <>
      {csrfToken && (
        <meta name="csrf-token" content={csrfToken} />
      )}
      {children}
    </>
  )
}