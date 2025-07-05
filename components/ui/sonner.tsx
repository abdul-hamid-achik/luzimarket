"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border-gray-800 group-[.toaster]:shadow-xl',
          description: 'group-[.toast]:text-gray-300',
          actionButton: 'group-[.toast]:bg-white group-[.toast]:text-gray-900',
          cancelButton: 'group-[.toast]:bg-gray-800 group-[.toast]:text-gray-300',
          success: 'group-[.toaster]:bg-green-900 group-[.toaster]:text-white group-[.toaster]:border-green-800',
          error: 'group-[.toaster]:bg-red-900 group-[.toaster]:text-white group-[.toaster]:border-red-800',
          warning: 'group-[.toaster]:bg-yellow-900 group-[.toaster]:text-white group-[.toaster]:border-yellow-800',
          info: 'group-[.toaster]:bg-blue-900 group-[.toaster]:text-white group-[.toaster]:border-blue-800',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
