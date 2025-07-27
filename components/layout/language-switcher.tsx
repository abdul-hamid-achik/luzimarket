"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Use next-intl's router which handles locale switching automatically
    router.replace(pathname as any, { locale: newLocale });
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[80px] border-0 bg-transparent" aria-label="Select language">
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