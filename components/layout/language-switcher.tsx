"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleLocaleChange = (newLocale: string) => {
    // Replace the locale in the pathname
    const currentLocale = pathname.startsWith('/en') ? 'en' : 'es';
    let newPath = pathname;
    
    if (currentLocale === 'en' && newLocale === 'es') {
      // Remove /en prefix
      newPath = pathname.replace(/^\/en/, '') || '/';
    } else if (currentLocale === 'es' && newLocale === 'en') {
      // Add /en prefix
      newPath = `/en${pathname}`;
    }
    
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[80px] border-0 bg-transparent">
        <Globe className="h-4 w-4 mr-2" />
        <span className="font-univers">{locale === 'es' ? 'ES' : 'EN'}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">
          <span className="font-univers">ES</span>
        </SelectItem>
        <SelectItem value="en">
          <span className="font-univers">EN</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}