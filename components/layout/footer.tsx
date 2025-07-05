import Image from "next/image";
import Link from "next/link";
import { Newsletter } from "./newsletter";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');
  const locale = useLocale();
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    { name: "Instagram", href: "#", icon: "/images/socials/Instagram.png" },
    { name: "Facebook", href: "#", icon: "/images/socials/Facebook.png" },
    { name: "TikTok", href: "#", icon: "/images/socials/TikTok.png" },
    { name: "WhatsApp", href: "#", icon: "/images/socials/Whatsapp.png" },
    { name: "X", href: "#", icon: "/images/socials/X.png" },
    { name: "YouTube", href: "#", icon: "/images/socials/Youtube.png" },
  ];

  return (
    <>
      <Newsletter />
      <footer className="bg-gradient-to-r from-green-400 via-yellow-300 to-cyan-400 text-black">
        <div className="px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="col-span-1">
            <Image 
              src="/images/logos/logo-simple.png" 
              alt="Luzi" 
              width={80} 
              height={30}
              className="h-8 w-auto mb-4"
            />
            <p className="text-sm font-univers">{t('tagline')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-univers font-bold mb-4">{t('shop')}</h3>
            <ul className="space-y-2 text-sm font-univers">
              <li><Link href={`/${locale}/products`} className="hover:underline">{t('products')}</Link></li>
              <li><Link href={`/${locale}/best-sellers`} className="hover:underline">{t('bestSellers')}</Link></li>
              <li><Link href={`/${locale}/categories`} className="hover:underline">{t('categories')}</Link></li>
              <li><Link href={`/${locale}/occasions`} className="hover:underline">{t('occasions')}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-univers font-bold mb-4">{t('company')}</h3>
            <ul className="space-y-2 text-sm font-univers">
              <li><Link href={`/${locale}/about`} className="hover:underline">{t('aboutUs')}</Link></li>
              <li><Link href={`/${locale}/vendor/register`} className="hover:underline">{t('sellWithUs')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="hover:underline">{t('contact')}</Link></li>
              <li><Link href={`/${locale}/editorial`} className="hover:underline">{t('editorial')}</Link></li>
              <li><Link href={`/${locale}/orders/lookup`} className="hover:underline">{t('trackOrder')}</Link></li>
              <li><Link href={`/${locale}/privacy`} className="hover:underline">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/terms`} className="hover:underline">{t('terms')}</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-univers font-bold mb-4">{t('followUs')}</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <Link 
                  key={social.name} 
                  href={social.href}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={social.name}
                >
                  <Image 
                    src={social.icon} 
                    alt={social.name} 
                    width={24} 
                    height={24}
                    className="w-6 h-6"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="border-t border-black/20 pt-8 mb-4">
          <div className="flex items-center justify-center gap-8">
            <span className="text-sm font-univers">COMING SOON</span>
            <span className="text-sm font-univers">PRÓXIMAMENTE</span>
            <span className="text-sm font-univers">BIENTÔT</span>
            <span className="text-sm font-univers">곧 출시</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs font-univers">{t('copyright', { year: currentYear })} / {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
    </>
  );
}