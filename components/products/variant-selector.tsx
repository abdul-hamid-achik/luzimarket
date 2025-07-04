'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface ProductVariant {
  id: string;
  name: string;
  variantType: string;
  price?: string;
  stock?: number;
  sku?: string;
  images?: string[];
  attributes?: Record<string, any>;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant?: ProductVariant;
  onVariantChange: (variant: ProductVariant) => void;
  className?: string;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  className
}: VariantSelectorProps) {
  // Group variants by type
  const variantGroups = variants.reduce((acc, variant) => {
    if (!acc[variant.variantType]) {
      acc[variant.variantType] = [];
    }
    acc[variant.variantType].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  const [selectedByType, setSelectedByType] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (selectedVariant) {
      initial[selectedVariant.variantType] = selectedVariant.id;
    }
    return initial;
  });

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedByType(prev => ({
      ...prev,
      [variant.variantType]: variant.id
    }));
    onVariantChange(variant);
  };

  // Format variant type for display
  const formatVariantType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(variantGroups).map(([type, typeVariants]) => (
        <div key={type} className="space-y-3">
          <h4 className="text-sm font-univers text-gray-700 uppercase tracking-wide">
            {formatVariantType(type)}
          </h4>
          
          {type === 'color' ? (
            // Color swatches
            <div className="flex flex-wrap gap-2">
              {typeVariants.map((variant) => {
                const isSelected = selectedByType[type] === variant.id;
                const colorValue = variant.attributes?.colorValue || variant.name;
                
                return (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all",
                      isSelected ? "border-black scale-110" : "border-gray-300",
                      variant.stock === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={variant.stock === 0}
                    title={variant.name}
                  >
                    <span
                      className="absolute inset-1 rounded-full"
                      style={{
                        backgroundColor: colorValue.startsWith('#') ? colorValue : undefined,
                        backgroundImage: colorValue.includes('gradient') ? colorValue : undefined,
                      }}
                    />
                    {variant.stock === 0 && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-gray-400 rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : type === 'size' ? (
            // Size buttons
            <div className="flex flex-wrap gap-2">
              {typeVariants.map((variant) => {
                const isSelected = selectedByType[type] === variant.id;
                
                return (
                  <Button
                    key={variant.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVariantSelect(variant)}
                    disabled={variant.stock === 0}
                    className={cn(
                      "min-w-[60px]",
                      variant.stock === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {variant.name}
                  </Button>
                );
              })}
            </div>
          ) : (
            // Default radio group for other variant types
            <RadioGroup
              value={selectedByType[type]}
              onValueChange={(value) => {
                const variant = typeVariants.find(v => v.id === value);
                if (variant) handleVariantSelect(variant);
              }}
            >
              {typeVariants.map((variant) => (
                <div key={variant.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={variant.id} 
                    id={variant.id}
                    disabled={variant.stock === 0}
                  />
                  <Label 
                    htmlFor={variant.id}
                    className={cn(
                      "cursor-pointer",
                      variant.stock === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span>{variant.name}</span>
                    {variant.price && (
                      <span className="ml-2 text-sm text-gray-600">
                        (+${Number(variant.price).toFixed(2)})
                      </span>
                    )}
                    {variant.stock !== undefined && variant.stock < 5 && variant.stock > 0 && (
                      <span className="ml-2 text-sm text-orange-600">
                        Only {variant.stock} left
                      </span>
                    )}
                    {variant.stock === 0 && (
                      <span className="ml-2 text-sm text-red-600">
                        Out of stock
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      ))}
    </div>
  );
}