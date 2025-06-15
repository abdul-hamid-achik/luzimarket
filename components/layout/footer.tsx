import Image from "next/image";
import Link from "next/link";
import { Newsletter } from "./newsletter";

export function Footer() {
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
        <div className="container mx-auto py-12">
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
            <p className="text-sm font-univers">Regalos curados y experiencias únicas en México.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-univers font-bold mb-4">COMPRA</h3>
            <ul className="space-y-2 text-sm font-univers">
              <li><Link href="/products" className="hover:underline">Productos</Link></li>
              <li><Link href="/best-sellers" className="hover:underline">Best Sellers</Link></li>
              <li><Link href="/categorias" className="hover:underline">Categorías</Link></li>
              <li><Link href="/ocasiones" className="hover:underline">Ocasiones</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-univers font-bold mb-4">EMPRESA</h3>
            <ul className="space-y-2 text-sm font-univers">
              <li><Link href="/about" className="hover:underline">Acerca de</Link></li>
              <li><Link href="/vendor/register" className="hover:underline">Vende con nosotros</Link></li>
              <li><Link href="/contact" className="hover:underline">Contacto</Link></li>
              <li><Link href="/editorial" className="hover:underline">Editorial</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-univers font-bold mb-4">SÍGUENOS</h3>
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
          <p className="text-xs font-univers">MOMENTO ESPECIAL SAPI DE CV © 2024 / TODOS LOS DERECHOS RESERVADOS</p>
        </div>
      </div>
    </footer>
    </>
  );
}