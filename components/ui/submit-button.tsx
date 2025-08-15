"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button, type buttonVariants } from "@/components/ui/button"

type ButtonVariantProps = Parameters<typeof buttonVariants>[0]

export interface SubmitButtonProps
    extends React.ComponentProps<typeof Button> {
    pendingText?: string
    pendingChildren?: React.ReactNode
    variant?: ButtonVariantProps extends infer T
    ? T extends { variant?: infer V }
    ? V
    : never
    : never
}

export function SubmitButton({
    children,
    pendingText,
    pendingChildren,
    disabled,
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button disabled={disabled || pending} {...props}>
            {pending ? (
                pendingChildren ?? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {pendingText ?? "Processing..."}
                    </>
                )
            ) : (
                children
            )}
        </Button>
    )
}

export default SubmitButton


