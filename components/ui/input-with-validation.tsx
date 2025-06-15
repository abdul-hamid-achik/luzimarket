"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export interface InputWithValidationProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isValid?: boolean;
  isInvalid?: boolean;
  showValidation?: boolean;
}

const InputWithValidation = React.forwardRef<HTMLInputElement, InputWithValidationProps>(
  ({ className, type, isValid, isInvalid, showValidation, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-univers ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showValidation && isValid && "border-green-500 pr-12",
            showValidation && isInvalid && "border-red-500 pr-12",
            className
          )}
          ref={ref}
          {...props}
        />
        {showValidation && (
          <>
            {isValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              </div>
            )}
            {isInvalid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                <X className="h-4 w-4 text-white" strokeWidth={3} />
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);
InputWithValidation.displayName = "InputWithValidation";

export { InputWithValidation };