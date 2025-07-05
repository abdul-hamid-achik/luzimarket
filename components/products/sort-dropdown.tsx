'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SortDropdown() {
  const t = useTranslations('Products');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'featured';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'featured') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-univers text-gray-600">{t('sortBy')}</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured">{t('sortOptions.featured')}</SelectItem>
          <SelectItem value="newest">{t('sortOptions.newest')}</SelectItem>
          <SelectItem value="price-asc">{t('sortOptions.priceAsc')}</SelectItem>
          <SelectItem value="price-desc">{t('sortOptions.priceDesc')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}