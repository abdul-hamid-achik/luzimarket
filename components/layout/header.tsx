"use client";

import { Link } from '@/i18n/navigation';
import NextLink from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, User, Menu, LogOut, Search } from "lucide-react";
import { SearchBox } from "./search-box";
import LanguageSwitcher from "./language-switcher";
import { ShippingLocationSelector } from "./shipping-location-selector";
import { CurrencySwitch } from "./currency-switch";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useTranslations } from 'next-intl';
import { useSession, signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleCart, getTotalItems } = useCart();
  const { getTotalItems: getWishlistItems } = useWishlist();
  const t = useTranslations('Common');
  const tNav = useTranslations('Navigation');
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b" data-testid="header">
      {/* Skip navigation link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-black focus:text-white focus:p-2 focus:rounded-br-md"
      >
        Skip to main content
      </a>
      <div>
        {/* Top bar - Desktop only */}
        <div className="hidden md:flex items-center justify-between py-2 text-xs border-b px-8">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <CurrencySwitch />
          </div>
          <div className="flex items-center gap-4">
            <ShippingLocationSelector />
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between py-4 gap-4 px-4 md:px-8">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('openMenu')} data-testid="mobile-menu-button">
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
                <div className="pb-4 border-b space-y-3">
                  <LanguageSwitcher />
                  <ShippingLocationSelector />
                </div>
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
          <Link href="/" className="flex-shrink-0" data-testid="logo-link">
            <Image
              src="/images/logos/logo-full.png"
              alt="Luzimarket"
              width={160}
              height={40}
              className="h-8 md:h-10 w-auto"
              priority
            />
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBox idSuffix="-desktop" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            <Button variant="ghost" size="sm" className="font-univers text-xs tracking-wider hidden md:inline-flex">
              FAMILY
            </Button>

            {/* Search Button - Mobile only */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label={t('search')}
              onClick={() => {
                // Toggle search input visibility
                const searchBox = document.querySelector('[data-testid="search-box"]');
                if (searchBox) {
                  const input = searchBox.querySelector('input');
                  if (input) {
                    input.focus();
                  }
                }
              }}
            >
              <Search className="h-4 w-4 mr-1" />
              Buscar
            </Button>

            <Link
              href="/wishlist"
              aria-label={getWishlistItems() > 0 ? t('wishlistWithItems', { count: getWishlistItems() }) : t('wishlist')}
            >
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
            {status === "loading" ? (
              <Button variant="ghost" size="icon" disabled aria-label={t('userAccount')}>
                <User className="h-5 w-5" />
              </Button>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t('userAccount')} data-testid="user-menu">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user?.name || t('user')}</p>
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NextLink href="/account" className="cursor-pointer" data-testid="account-link">
                      {t('myAccount')}
                    </NextLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NextLink href="/orders" className="cursor-pointer">
                      {t('myOrders')}
                    </NextLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NextLink href="/orders/lookup" className="cursor-pointer">
                      {t('trackOrder')}
                    </NextLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t('userAccount')}>
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <NextLink href="/login" className="cursor-pointer">
                      {t('login')}
                    </NextLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NextLink href="/register" className="cursor-pointer">
                      {t('register')}
                    </NextLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NextLink href="/orders/lookup" className="cursor-pointer">
                      {t('trackOrder')}
                    </NextLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="relative"
              aria-label={getTotalItems() > 0 ? t('shoppingCartWithItems', { count: getTotalItems() }) : t('shoppingCart')}
              data-testid="cart-button"
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
          <SearchBox idSuffix="-mobile" />
        </div>

        {/* Navigation - Desktop only */}
        <nav className="hidden md:flex items-center justify-center gap-8 py-3 px-8">
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