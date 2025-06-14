import { put, head } from '@vercel/blob';
import { readFile, access } from 'fs/promises';
import path from 'path';

// Environment variables
const VERCEL_BLOB_TOKEN = process.env.VERCEL_BLOB_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Optional

// Rate limiting for Unsplash API (50 requests/hour)
let unsplashRequestCount = 0;
let unsplashRateLimitReset = Date.now() + (60 * 60 * 1000); // Reset every hour

// User's provided images for seeding (relative to frontend/src/pages/inicio/images/)
const USER_PROVIDED_IMAGES: Record<string, string> = {
    'imagen_muestra1.jpg': 'imagen_muestra1.jpg',
    'imagen_muestra2.jpg': 'imagen_muestra2.jpg',
    'imagen_muestra3.jpg': 'imagen_muestra3.jpg',
    'imagen_muestra4.jpg': 'imagen_muestra4.jpg',
    'new_banner_luzi.png': 'new_images_luzi/new_banner_luzi.png',
    'new_banner_luzi2.png': 'new_images_luzi/new_banner_luzi2.png',
    'pastel_chocolate.png': 'productos/pastel_chocolate.png',
    'tenis.png': 'productos/tenis.png',
    'flores.png': 'productos/flores.png',
    'chocolates.png': 'productos/chocolates.png',
    'imagen_principal.png': 'imagen_principal.png'
};

// Mapping categories to user's provided images and search terms
const ENHANCED_IMAGE_MAPPING: Record<string, {
    userImages: string[];
    searchTerms: string[];
}> = {
    'arreglos-florales': {
        userImages: ['imagen_muestra1.jpg', 'flores.png', 'imagen_muestra2.jpg'],
        searchTerms: ['bouquet', 'roses', 'flowers', 'floral arrangement']
    },
    'canastas-de-regalo': {
        userImages: ['imagen_muestra3.jpg', 'imagen_muestra4.jpg', 'chocolates.png'],
        searchTerms: ['gift basket', 'hamper', 'gourmet basket', 'luxury gifts']
    },
    'chocolates': {
        userImages: ['chocolates.png', 'pastel_chocolate.png', 'imagen_muestra3.jpg'],
        searchTerms: ['chocolate', 'gourmet chocolate', 'luxury sweets', 'premium confection']
    },
    'regalos-especiales': {
        userImages: ['imagen_muestra1.jpg', 'imagen_muestra2.jpg', 'imagen_principal.png'],
        searchTerms: ['luxury gift', 'premium present', 'special gift', 'elegant present']
    },
    'default': {
        userImages: ['imagen_muestra1.jpg', 'imagen_muestra2.jpg', 'imagen_muestra3.jpg', 'imagen_muestra4.jpg'],
        searchTerms: ['gift', 'luxury', 'premium', 'handpicked']
    }
};

// Homepage slide banners
const HOMEPAGE_BANNERS = [
    'new_banner_luzi.png',
    'new_banner_luzi2.png',
    'imagen_principal.png'
];

// Legacy search terms for fallback
// const IMAGE_SEARCH_TERMS: Record<string, string[]> = {
//     'arreglos-florales': ['roses', 'flowers', 'bouquet', 'floral arrangement', 'elegant flowers'],
//     'canastas-de-regalo': ['gift basket', 'hamper', 'luxury basket', 'gourmet gifts', 'premium basket'],
//     'regalos-especiales': ['luxury gift', 'premium present', 'special gift', 'elegant present'],
//     'ocasiones-especiales': ['celebration', 'special occasion', 'festive', 'party', 'elegant event'],
//     'productos-gourmet': ['gourmet', 'delicacy', 'premium food', 'artisan', 'luxury food'],
//     'decoracion': ['home decor', 'elegant decoration', 'luxury decor', 'premium decoration'],
//     'joyeria': ['jewelry', 'elegant jewelry', 'luxury accessories', 'premium jewelry'],
//     'perfumes': ['perfume', 'fragrance', 'luxury scent', 'premium perfume'],
//     'vinos-y-licores': ['wine', 'champagne', 'luxury wine', 'premium spirits'],
//     'chocolates': ['chocolate', 'gourmet chocolate', 'luxury sweets', 'premium confection']
// };

interface ImageUploadResult {
    url: string;
    alt: string;
    success: boolean;
    error?: string;
    isExisting?: boolean;
    source?: 'user-provided' | 'existing-blob' | 'unsplash' | 'placeholder';
}

export class ImageService {
    private static instance: ImageService;

    static getInstance(): ImageService {
        if (!ImageService.instance) {
            ImageService.instance = new ImageService();
        }
        return ImageService.instance;
    }

    private constructor() {
        if (!VERCEL_BLOB_TOKEN) {
            console.warn('Vercel Blob token not found. Image uploads will be skipped.');
        }
    }

    /**
     * Reset Unsplash rate limit counter if hour has passed
     */
    private checkUnsplashRateLimit(): boolean {
        if (Date.now() > unsplashRateLimitReset) {
            unsplashRequestCount = 0;
            unsplashRateLimitReset = Date.now() + (60 * 60 * 1000);
        }

        if (unsplashRequestCount >= 50) {
            console.warn('⚠️  Unsplash rate limit reached (50/hour). Using fallback images.');
            return false;
        }

        return true;
    }

    /**
     * Generate predictable file path for demo images
     */
    private generatePredictablePath(categorySlug: string, productName: string): string {
        const sanitizedProductName = productName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();

        return `demo/products/${categorySlug}/${sanitizedProductName}.jpg`;
    }

    /**
     * Generate predictable path for homepage slides
     */
    private generateHomepageSlidePath(slideId: string): string {
        return `demo/homepage/slide-${slideId}.jpg`;
    }

    /**
     * Check if image exists in Vercel Blob by pathname
     */
    private async imageExists(pathname: string): Promise<string | null> {
        if (!VERCEL_BLOB_TOKEN) {
            return null;
        }

        try {
            const blobDetails = await head(pathname, { token: VERCEL_BLOB_TOKEN });
            return blobDetails.url; // Return the actual URL if it exists
        } catch (error) {
            // Image doesn't exist or other error
            return null;
        }
    }

    /**
     * Get absolute path to user provided image
     */
    private getUserProvidedImagePath(imageName: string): string | null {
        const relativePath = USER_PROVIDED_IMAGES[imageName];
        if (!relativePath) {
            return null;
        }

        // Get the absolute path to the image file
        // Since we're running from apps/backend, we need to go up to the project root
        const baseDir = path.resolve(process.cwd(), '..', 'frontend', 'src', 'pages', 'inicio', 'images');
        return path.join(baseDir, relativePath);
    }

    /**
     * Read local image file and upload to Vercel Blob
     */
    private async uploadLocalImageToBlob(imagePath: string, pathname: string): Promise<string | null> {
        if (!VERCEL_BLOB_TOKEN) {
            console.warn('Vercel Blob not configured, cannot upload local image');
            return null;
        }

        try {
            // Read the local file
            const imageBuffer = await readFile(imagePath);

            // Get file extension for content type
            const ext = path.extname(imagePath).toLowerCase();
            const contentTypeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            };
            const contentType = contentTypeMap[ext] || 'image/jpeg';

            // Upload to Vercel Blob
            const blob = await put(pathname, imageBuffer, {
                access: 'public',
                token: VERCEL_BLOB_TOKEN,
                contentType
            });

            return blob.url;
        } catch (error) {
            console.error('Error uploading local image to Vercel Blob:', error);
            return null;
        }
    }

    /**
     * Select appropriate user image for category
     */
    private selectUserImageForCategory(categorySlug: string, productId: string): string | null {
        const mapping = ENHANCED_IMAGE_MAPPING[categorySlug] || ENHANCED_IMAGE_MAPPING['default'];

        if (mapping.userImages.length === 0) {
            return null;
        }

        // Use product ID hash to consistently select the same image for the same product
        const productIdHash = parseInt(productId.toString().slice(-2), 10) || 0;
        const imageIndex = productIdHash % mapping.userImages.length;
        const selectedImage = mapping.userImages[imageIndex];

        return this.getUserProvidedImagePath(selectedImage);
    }

    /**
     * Fetch image from Unsplash API with rate limiting
     */
    private async fetchFromUnsplash(searchTerm: string): Promise<{ url: string; alt: string } | null> {
        if (!UNSPLASH_ACCESS_KEY || !this.checkUnsplashRateLimit()) {
            return null;
        }

        try {
            unsplashRequestCount++;
            console.log(`🔍 Unsplash API call ${unsplashRequestCount}/50: "${searchTerm}"`);

            const response = await fetch(
                `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchTerm)}&orientation=landscape&w=800&h=600`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (!response.ok) {
                console.warn(`Unsplash API error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return {
                url: data.urls.regular,
                alt: data.alt_description || searchTerm
            };
        } catch (error) {
            console.warn('Error fetching from Unsplash:', error);
            return null;
        }
    }

    /**
     * Generate placeholder image as fallback
     */
    private generatePlaceholderImage(searchTerm: string): { url: string; alt: string } {
        const seed = searchTerm.replace(/\s+/g, '-').toLowerCase();
        return {
            url: `https://picsum.photos/seed/${seed}/800/600`,
            alt: `Imagen de ${searchTerm}`
        };
    }

    /**
     * Upload image to Vercel Blob using the official SDK
     */
    private async uploadToBlob(imageUrl: string, pathname: string): Promise<string | null> {
        if (!VERCEL_BLOB_TOKEN) {
            console.warn('Vercel Blob not configured, using original image URL');
            return imageUrl; // Return original URL as fallback
        }

        try {
            // Fetch the image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
            }

            const imageBlob = await imageResponse.blob();

            // Upload to Vercel Blob using the official SDK
            const blob = await put(pathname, imageBlob, {
                access: 'public',
                token: VERCEL_BLOB_TOKEN,
            });

            return blob.url; // Use the URL returned by Vercel Blob
        } catch (error) {
            console.error('Error uploading to Vercel Blob:', error);
            return imageUrl; // Return original URL as fallback instead of null
        }
    }

    /**
     * Get a single image for a product with enhanced logic
     */
    async getImageForProduct(categorySlug: string, productId: string, productName: string): Promise<ImageUploadResult> {
        const pathname = this.generatePredictablePath(categorySlug, productName);

        // 1. Check if image already exists in Vercel Blob
        const existingUrl = await this.imageExists(pathname);
        if (existingUrl) {
            console.log(`♻️  Reusing existing blob image: ${pathname}`);
            return {
                url: existingUrl,
                alt: `${productName}`,
                success: true,
                isExisting: true,
                source: 'existing-blob'
            };
        }

        console.log(`📸 Creating new image: ${pathname}`);

        // 2. Try user provided images first
        const userImagePath = this.selectUserImageForCategory(categorySlug, productId);
        if (userImagePath) {
            // Check if file exists before trying to upload
            try {
                await access(userImagePath);
                console.log(`🖼️  Using user provided image for ${productName}`);
                const uploadedUrl = await this.uploadLocalImageToBlob(userImagePath, pathname);

                if (uploadedUrl) {
                    return {
                        url: uploadedUrl,
                        alt: `${productName} - Imagen seleccionada`,
                        success: true,
                        isExisting: false,
                        source: 'user-provided'
                    };
                } else {
                    console.warn(`Failed to upload user image for ${productName}, trying Unsplash`);
                }
            } catch (error) {
                console.warn(`User image not found at ${userImagePath}, trying Unsplash`);
            }
        }

        // 3. Try Unsplash with rate limiting
        const mapping = ENHANCED_IMAGE_MAPPING[categorySlug] || ENHANCED_IMAGE_MAPPING['default'];
        const productIdHash = parseInt(productId.toString().slice(-2), 10) || 0;
        const searchTermIndex = productIdHash % mapping.searchTerms.length;
        const searchTerm = mapping.searchTerms[searchTermIndex];

        console.log(`🔍 Using search term: "${searchTerm}" for ${productName}`);

        let imageData: { url: string; alt: string } | null = null;

        // Try Unsplash if within rate limits
        imageData = await this.fetchFromUnsplash(searchTerm);

        // 4. Fallback to placeholder
        if (!imageData) {
            imageData = this.generatePlaceholderImage(searchTerm);
        }

        // Upload to Vercel Blob
        const uploadedUrl = await this.uploadToBlob(imageData.url, pathname);

        return {
            url: uploadedUrl || imageData.url,
            alt: `${productName} - ${imageData.alt}`,
            success: !!uploadedUrl,
            isExisting: false,
            source: imageData.url.includes('unsplash') ? 'unsplash' : 'placeholder'
        };
    }

    /**
     * Get image for homepage slide
     */
    async getHomepageSlideImage(slideId: string, title: string): Promise<ImageUploadResult> {
        const pathname = this.generateHomepageSlidePath(slideId);

        // Check if image already exists
        const existingUrl = await this.imageExists(pathname);
        if (existingUrl) {
            console.log(`♻️  Reusing existing homepage slide: ${pathname}`);
            return {
                url: existingUrl,
                alt: title,
                success: true,
                isExisting: true,
                source: 'existing-blob'
            };
        }

        // Use appropriate banner image
        const slideIndex = parseInt(slideId) || 0;
        const bannerImage = HOMEPAGE_BANNERS[slideIndex % HOMEPAGE_BANNERS.length];
        const bannerPath = this.getUserProvidedImagePath(bannerImage);

        if (bannerPath) {
            console.log(`🏠 Using banner image ${bannerImage} for slide ${slideId}`);
            const uploadedUrl = await this.uploadLocalImageToBlob(bannerPath, pathname);

            if (uploadedUrl) {
                return {
                    url: uploadedUrl,
                    alt: title,
                    success: true,
                    isExisting: false,
                    source: 'user-provided'
                };
            } else {
                console.warn(`Failed to upload banner image ${bannerImage}, using placeholder`);
            }
        }

        // Fallback to placeholder
        const placeholderData = this.generatePlaceholderImage(title);
        const uploadedUrl = await this.uploadToBlob(placeholderData.url, pathname);

        return {
            url: uploadedUrl || placeholderData.url,
            alt: title,
            success: !!uploadedUrl,
            isExisting: false,
            source: 'placeholder'
        };
    }

    /**
     * Check if a product already has images in the database
     */
    async checkExistingImages(db: any, schema: any, productId: string): Promise<boolean> {
        try {
            let result;

            // Check if we have raw access (PostgreSQL)
            if (db.raw && db.raw.execute) {
                result = await db.raw.execute({
                    sql: 'SELECT COUNT(*) as count FROM photos WHERE product_id = $1',
                    args: [productId]
                });
            } else {
                // Use standard Drizzle query
                const { sql, eq } = await import('drizzle-orm');
                result = await db.select({ count: sql`COUNT(*)` })
                    .from(schema.photos)
                    .where(eq(schema.photos.productId, productId));
            }

            // Handle response format
            const count = Array.isArray(result) ?
                result[0]?.count :
                (result.rows?.[0]?.count || result[0]?.count || 0);

            return Number(count) > 0;
        } catch (error) {
            console.error('Error checking existing images:', error);
            // If we can't check, assume no images to be safe
            return false;
        }
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus(): { requestsUsed: number; requestsRemaining: number; resetTime: Date } {
        return {
            requestsUsed: unsplashRequestCount,
            requestsRemaining: 50 - unsplashRequestCount,
            resetTime: new Date(unsplashRateLimitReset)
        };
    }
}

export const imageService = ImageService.getInstance(); 