"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface LoadingButtonProps
    extends React.ComponentProps<typeof Button> {
    isLoading?: boolean
    loadingText?: string
}

export function LoadingButton({
    isLoading,
    loadingText,
    disabled,
    children,
    ...props
}: LoadingButtonProps) {
    return (
        <Button disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText ?? "Loading..."}
                </>
            ) : (
                children
            )}
        </Button>
    )
}

export default LoadingButton


