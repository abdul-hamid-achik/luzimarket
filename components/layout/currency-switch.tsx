"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/currency-context";

export function CurrencySwitch() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2" data-testid="currency-switch-container">
      <Label htmlFor="currency-switch" className="text-xs text-gray-600">
        MXN
      </Label>
      <Switch
        id="currency-switch"
        data-testid="currency-switch"
        checked={currency === 'USD'}
        onCheckedChange={(checked) => setCurrency(checked ? 'USD' : 'MXN')}
        className="h-4 w-8"
        aria-label="Toggle between MXN and USD currency"
      />
      <Label htmlFor="currency-switch" className="text-xs text-gray-600">
        USD
      </Label>
    </div>
  );
}