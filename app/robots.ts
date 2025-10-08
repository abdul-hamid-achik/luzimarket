import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luzimarket.shop';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/vendor/',
                    '/api/',
                    '/checkout/',
                    '/_next/',
                    '/tmp/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}


