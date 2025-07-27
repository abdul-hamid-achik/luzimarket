"use client";

import { useShippingLocation } from "@/contexts/shipping-location-context";
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

export function ShippingLocationSelector() {
  const { location, setLocation, availableLocations } = useShippingLocation();
  const t = useTranslations('Common');

  const handleLocationChange = (value: string) => {
    const selected = availableLocations.find(loc => loc.displayName === value);
    if (selected) {
      setLocation(selected);
    }
  };

  return (
    <div className="flex items-center gap-2 text-gray-600">
      <MapPin className="h-3 w-3" />
      <span className="hidden sm:inline">{t('shippingTo', { location: '' }).replace(': ', '')}:</span>
      <Select value={location.displayName} onValueChange={handleLocationChange}>
        <SelectTrigger className="border-0 bg-transparent h-auto p-0 font-medium text-gray-900 hover:text-gray-600" aria-label="Select shipping location">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableLocations.map((loc) => (
            <SelectItem key={`${loc.city}-${loc.state}`} value={loc.displayName}>
              {loc.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}