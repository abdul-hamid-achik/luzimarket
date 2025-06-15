"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, User, Menu } from "lucide-react";
import { SearchBox } from "./search-box";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleCart, getTotalItems } = useCart();
  const { getTotalItems: getWishlistItems } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto">
        {/* Top bar - Desktop only */}
        <div className="hidden md:flex items-center justify-between py-2 text-xs border-b">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">ESP - MXN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Envío a: MONTERREY, NL</span>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>
                  <Image 
                    src="/images/logos/logo-simple.png" 
                    alt="Luzi" 
                    width={80} 
                    height={30}
                    className="h-6 w-auto"
                  />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 space-y-4">
                <Link 
                  href="/best-sellers" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Best Sellers
                </Link>
                <Link 
                  href="/handpicked" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Handpicked
                </Link>
                <Link 
                  href="/tiendas-marcas" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tiendas + Marcas
                </Link>
                <Link 
                  href="/categorias" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categorías
                </Link>
                <Link 
                  href="/ocasiones" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ocasiones
                </Link>
                <Link 
                  href="/editorial" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Editorial
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image 
              src="/images/logos/logo-full.png" 
              alt="Luzimarket" 
              width={150} 
              height={40}
              className="h-6 md:h-8 w-auto"
              priority
            />
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBox />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            <Button variant="ghost" size="sm" className="font-univers hidden md:inline-flex">
              FAMILY
            </Button>
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="hidden md:inline-flex relative">
                <Heart className="h-5 w-5" />
                {getWishlistItems() > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {getWishlistItems()}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleCart} className="relative">
              <ShoppingBag className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Search - Mobile */}
        <div className="md:hidden pb-3">
          <SearchBox />
        </div>

        {/* Navigation - Desktop only */}
        <nav className="hidden md:flex items-center gap-8 py-3">
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