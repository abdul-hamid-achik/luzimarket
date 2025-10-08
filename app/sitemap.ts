import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Import db lazily to avoid build-time connection
    const { db } = await import('@/db');
    const { products, categories, vendors } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luzimarket.shop';

    // Static routes
    const routes = [
        '',
        '/productos',
        '/categorias',
        '/tiendas-marcas',
        '/acerca-de',
        '/contacto',
        '/terminos',
        '/privacidad',
    ].map((route) => ({
        url: `${baseUrl}/es${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
        alternates: {
            languages: {
                es: `${baseUrl}/es${route}`,
                en: `${baseUrl}/en${route.replace('/productos', '/products').replace('/categorias', '/categories')}`,
            },
        },
    }));

    // Product pages
    const allProducts = await db
        .select({
            slug: products.slug,
            updatedAt: products.updatedAt,
        })
        .from(products)
        .where(eq(products.isActive, true))
        .limit(1000);

    const productRoutes = allProducts.map((product) => ({
        url: `${baseUrl}/es/productos/${product.slug}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: {
            languages: {
                es: `${baseUrl}/es/productos/${product.slug}`,
                en: `${baseUrl}/en/products/${product.slug}`,
            },
        },
    }));

    // Category pages
    const allCategories = await db
        .select({
            slug: categories.slug,
        })
        .from(categories)
        .where(eq(categories.isActive, true));

    const categoryRoutes = allCategories.map((category) => ({
        url: `${baseUrl}/es/categoria/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
        alternates: {
            languages: {
                es: `${baseUrl}/es/categoria/${category.slug}`,
                en: `${baseUrl}/en/category/${category.slug}`,
            },
        },
    }));

    // Vendor pages
    const allVendors = await db
        .select({
            slug: vendors.slug,
        })
        .from(vendors)
        .where(eq(vendors.isActive, true))
        .limit(500);

    const vendorRoutes = allVendors.map((vendor) => ({
        url: `${baseUrl}/es/tienda/${vendor.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [...routes, ...productRoutes, ...categoryRoutes, ...vendorRoutes];
}


