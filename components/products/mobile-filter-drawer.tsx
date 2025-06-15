"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterSidebar } from "./filter-sidebar";

interface MobileFilterDrawerProps {
  categories: Array<{ id: string; name: string; count: number }>;
  vendors: Array<{ id: string; name: string; count: number }>;
  priceRange: { min: number; max: number };
}

export function MobileFilterDrawer({ categories, vendors, priceRange }: MobileFilterDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-univers">Filtros</SheetTitle>
        </SheetHeader>
        <div className="mt-6 pr-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          <FilterSidebar
            categories={categories}
            vendors={vendors}
            priceRange={priceRange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}