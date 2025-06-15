"use client";

import { Link } from '@/i18n/navigation';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, User, Menu } from "lucide-react";
import { SearchBox } from "./search-box";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Common');
  const tNav = useTranslations('Navigation');

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div>
        {/* Top bar - Desktop only */}
        <div className="hidden md:flex items-center justify-between py-2 text-xs border-b px-8">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{t('currencyLocale')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{t('shippingTo', { location: 'MONTERREY, NL' })}</span>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4 gap-4 px-4 md:px-8">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('openMenu')}>
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
                  {tNav('bestSellers')}
                </Link>
                <Link 
                  href="/handpicked" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {tNav('handpicked')}
                </Link>
                <Link 
                  href="/brands" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {tNav('brandsAndStores')}
                </Link>
                <Link 
                  href="/categories" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {tNav('categories')}
                </Link>
                <Link 
                  href="/occasions" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {tNav('occasions')}
                </Link>
                <Link 
                  href="/editorial" 
                  className="block py-2 text-sm font-univers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {tNav('editorial')}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl md:text-2xl font-times-now tracking-wider">LUZIMARKET</span>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBox />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            <Button variant="ghost" size="sm" className="font-univers text-xs tracking-wider hidden md:inline-flex">
              FAMILY
            </Button>
            <Link href="/wishlist">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:inline-flex relative"
                aria-label={getWishlistItems() > 0 ? t('wishlistWithItems', { count: getWishlistItems() }) : t('wishlist')}
              >
                <Heart className="h-5 w-5" />
                {getWishlistItems() > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {getWishlistItems()}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="icon" aria-label={t('userAccount')}>
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCart} 
              className="relative"
              aria-label={getTotalItems() > 0 ? t('shoppingCartWithItems', { count: getTotalItems() }) : t('shoppingCart')}
            >
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
        <div className="md:hidden pb-3 px-4">
          <SearchBox />
        </div>

        {/* Navigation - Desktop only */}
        <nav className="hidden md:flex items-center gap-8 py-3 px-8">
          <Link href="/best-sellers" className="text-xs font-univers hover:text-gray-600 tracking-wide">
            {tNav('bestSellers')}
          </Link>
          <Link href="/handpicked" className="text-xs font-univers hover:text-gray-600 tracking-wide">
            {tNav('handpicked')}
          </Link>
          <Link href="/brands" className="text-xs font-univers hover:text-gray-600 tracking-wide">
            {tNav('brandsAndStores')}
          </Link>
          <Link href="/categories" className="text-xs font-univers hover:text-gray-600 tracking-wide">
            {tNav('categories')}
          </Link>
          <Link href="/occasions" className="text-xs font-univers hover:text-gray-600 tracking-wide">
            {tNav('occasions')}
          </Link>
          <Link href="/editorial" className="text-xs font-univers hover:text-gray-600 tracking-wide">
            {tNav('editorial')}
          </Link>
        </nav>
      </div>
    </header>
  );
}