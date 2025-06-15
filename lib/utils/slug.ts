import slugify from "slugify";

export function generateSlug(text: string, locale: string = 'es'): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: locale
  });
}

export async function generateUniqueSlug(
  text: string,
  checkUniqueness: (slug: string) => Promise<boolean>,
  locale: string = 'es'
): Promise<string> {
  let baseSlug = generateSlug(text, locale);
  let slug = baseSlug;
  let counter = 1;
  
  while (!(await checkUniqueness(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}