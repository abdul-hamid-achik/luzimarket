"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const filters = {
  category: ["Flowershop", "Classic", "Modern", "Plantas", "Condolencias"],
  brand: ["Tiendas + Marcas"],
  color: ["Color"],
  priceRange: ["Rango de Precio"],
};

const products = [
  {
    id: 1,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 2,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
  {
    id: 3,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 4,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
  {
    id: 5,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/pia-riverola.webp",
  },
  {
    id: 6,
    name: "Sunkissed Box",
    vendor: "BOTANICA",
    price: "$1,000",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
  },
];

export default function ProductsPage() {
  const [selectedFilters, setSelectedFilters] = useState({
    category: "Flowershop",
    sortBy: "Ordenar por",
    selection: "Nuestra selección",
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-univers text-sm mb-3">{filters.category[0]}</h3>
                <ul className="space-y-2">
                  {filters.category.slice(1).map((item) => (
                    <li key={item}>
                      <button className="text-sm font-univers text-gray-600 hover:text-black">
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Other Filters */}
              {Object.entries(filters).slice(1).map(([key, values]) => (
                <div key={key}>
                  <h3 className="font-univers text-sm mb-3">{values[0]}</h3>
                </div>
              ))}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort and Filter Options */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b">
              <div className="flex gap-4">
                <select className="text-sm font-univers border-0 bg-transparent cursor-pointer">
                  <option>Ordenar por</option>
                  <option>Precio: Menor a Mayor</option>
                  <option>Precio: Mayor a Menor</option>
                  <option>Más reciente</option>
                </select>
                <select className="text-sm font-univers border-0 bg-transparent cursor-pointer">
                  <option>Nuestra selección</option>
                  <option>Más reciente</option>
                  <option>Más vendido</option>
                </select>
              </div>
              <div className="text-sm font-univers text-gray-600">
                <span className="mr-4">Precio más bajo a más alto</span>
                <span>Precio más alto a más bajo</span>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-univers text-sm">{product.name}</h3>
                    <p className="text-xs text-gray-600 font-univers">+ {product.vendor}</p>
                    <p className="font-univers">{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}