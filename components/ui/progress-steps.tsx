"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function ProgressSteps({
  steps,
  currentStep,
  className,
  orientation = "horizontal",
}: ProgressStepsProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              orientation === "horizontal" ? "flex-1" : "w-full"
            )}
          >
            {/* Step */}
            <div
              className={cn(
                "flex items-center",
                orientation === "vertical" && "w-full"
              )}
            >
              {/* Circle */}
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isCompleted
                    ? "border-green-500 bg-green-500 text-white"
                    : isActive
                    ? "border-black bg-black text-white"
                    : "border-gray-300 bg-white text-gray-500"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  <span className="font-univers text-sm font-medium">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Text */}
              <div
                className={cn(
                  "ml-3",
                  orientation === "vertical" && "flex-1"
                )}
              >
                <p
                  className={cn(
                    "font-univers text-sm font-medium transition-colors",
                    isActive ? "text-black" : "text-gray-500"
                  )}
                >
                  {step.title}
                </p>
                {step.description && orientation === "vertical" && (
                  <p className="mt-1 text-xs font-univers text-gray-400">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Line */}
            {!isLast && (
              <div
                className={cn(
                  "flex-1",
                  orientation === "horizontal"
                    ? "mx-4 h-[2px]"
                    : "ml-5 my-2 w-[2px] h-8"
                )}
              >
                <div
                  className={cn(
                    "h-full w-full transition-all duration-300",
                    isCompleted ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Mobile-friendly version with simplified design
export function MobileProgressSteps({
  steps,
  currentStep,
  className,
}: {
  steps: Step[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-univers text-gray-600">
          Paso {currentStep + 1} de {steps.length}
        </span>
        <span className="text-sm font-univers font-medium">
          {steps[currentStep].title}
        </span>
      </div>
      
      {/* Progress indicator */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-black transition-all duration-300"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}