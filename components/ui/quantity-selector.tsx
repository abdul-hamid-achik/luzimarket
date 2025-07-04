'use client';

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <div className="w-12 text-center font-univers text-sm">
        {quantity}
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}