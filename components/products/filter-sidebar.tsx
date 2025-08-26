"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FilterOption {
  id: string;
  name: string;
  count: number;
}

interface FilterSidebarProps {
  categories?: FilterOption[];
  vendors?: FilterOption[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export function FilterSidebar({
  categories = [],
  vendors = [],
  priceRange = { min: 0, max: 10000 }
}: FilterSidebarProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Products");

  // Parse current filters from URL
  const currentCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const currentVendors = searchParams.get("vendors")?.split(",").filter(Boolean) || [];
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";

  // Local state for inputs
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  // Collapsible states
  const [openSections, setOpenSections] = useState({
    categories: true,
    vendors: true,
    price: true,
  });

  // Update URL with new filters
  const updateFilters = (updates: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`?${params.toString()}` as any);
  };

  // Handle category toggle
  const toggleCategory = (categoryId: string) => {
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];

    updateFilters({ categories: newCategories });
  };

  // Handle vendor toggle
  const toggleVendor = (vendorId: string) => {
    const newVendors = currentVendors.includes(vendorId)
      ? currentVendors.filter(id => id !== vendorId)
      : [...currentVendors, vendorId];

    updateFilters({ vendors: newVendors });
  };

  // Handle price filter
  const applyPriceFilter = () => {
    updateFilters({
      minPrice: minPrice,
      maxPrice: maxPrice,
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push("/products");
  };

  const hasActiveFilters =
    currentCategories.length > 0 ||
    currentVendors.length > 0 ||
    currentMinPrice ||
    currentMaxPrice;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs font-univers"
          >
            {t("clearAll")}
          </Button>
        )}
      </div>

      {/* Categories */}
      <Collapsible
        open={openSections.categories}
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, categories: open }))}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-univers hover:text-gray-700">
          <span>{t("categories")}</span>
          {openSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={currentCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="flex-1 text-sm font-univers cursor-pointer flex items-center justify-between"
              >
                <span>{category.name}</span>
                <span className="text-xs text-gray-500">({category.count})</span>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Vendors/Brands */}
      <Collapsible
        open={openSections.vendors}
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, vendors: open }))}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-univers hover:text-gray-700">
          <span>{t("vendors")}</span>
          {openSections.vendors ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-3">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="flex items-center space-x-2">
              <Checkbox
                id={`vendor-${vendor.id}`}
                checked={currentVendors.includes(vendor.id)}
                onCheckedChange={() => toggleVendor(vendor.id)}
              />
              <Label
                htmlFor={`vendor-${vendor.id}`}
                className="flex-1 text-sm font-univers cursor-pointer flex items-center justify-between"
              >
                <span>{vendor.name}</span>
                <span className="text-xs text-gray-500">({vendor.count})</span>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible
        open={openSections.price}
        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, price: open }))}
        className="mb-6"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-univers hover:text-gray-700">
          <span>{t("priceRange")}</span>
          {openSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="min-price" className="text-xs font-univers text-gray-600">
                  {t("minPrice")}
                </Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder={`$${priceRange.min}`}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="max-price" className="text-xs font-univers text-gray-600">
                  {t("maxPrice")}
                </Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder={`$${priceRange.max}`}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={applyPriceFilter}
              className="w-full"
              size="sm"
            >
              {t("applyFilters")}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}