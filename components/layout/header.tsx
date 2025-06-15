"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, ShoppingBag, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 text-xs border-b">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">ESP - MXN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Envío a: MONTERREY, NL</span>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image 
              src="/images/logos/logo-full.png" 
              alt="Luzimarket" 
              width={150} 
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                type="search" 
                placeholder="Buscar" 
                className="pl-10 pr-4 w-full border-gray-300 rounded-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" className="font-univers">
              FAMILY
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8 py-3">
          <Link href="/best-sellers" className="text-sm font-univers hover:text-gray-600">
            Best Sellers
          </Link>
          <Link href="/handpicked" className="text-sm font-univers hover:text-gray-600">
            Handpicked
          </Link>
          <Link href="/tiendas-marcas" className="text-sm font-univers hover:text-gray-600">
            Tiendas + Marcas
          </Link>
          <Link href="/categorias" className="text-sm font-univers hover:text-gray-600">
            Categorías
          </Link>
          <Link href="/ocasiones" className="text-sm font-univers hover:text-gray-600">
            Ocasiones
          </Link>
          <Link href="/editorial" className="text-sm font-univers hover:text-gray-600">
            Editorial
          </Link>
        </nav>
      </div>
    </header>
  );
}