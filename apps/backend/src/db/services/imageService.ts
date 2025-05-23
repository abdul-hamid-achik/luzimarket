import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

// Environment variables
const VERCEL_BLOB_TOKEN = process.env.VERCEL_BLOB_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY; // Optional

// Image categories mapped to search terms
const IMAGE_SEARCH_TERMS: Record<string, string[]> = {
    'floral-arrangements': ['flowers', 'bouquet', 'roses', 'floral arrangement'],
    'gift-baskets': ['gift basket', 'hamper', 'gift box', 'present'],
    'gourmet-treats': ['chocolates', 'gourmet food', 'sweets', 'treats'],
    'home-decor-gifts': ['home decor', 'vase', 'candles', 'decoration'],
    'personalized-gifts': ['personalized gift', 'custom gift', 'engraved'],
    'aromatherapy-wellness': ['aromatherapy', 'essential oils', 'spa', 'wellness'],
    'seasonal-specials': ['seasonal gifts', 'holiday', 'celebration'],
    'luxury-gifts': ['luxury', 'premium', 'elegant gift'],
    'handcrafted-items': ['handmade', 'artisan', 'craft', 'handcrafted'],
    'eco-friendly-gifts': ['eco friendly', 'sustainable', 'natural', 'organic']
};

interface ImageUploadResult {
    url: string;
    alt: string;
    success: boolean;
    error?: string;
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
     * Fetch image from Unsplash API
     */
    private async fetchFromUnsplash(searchTerm: string): Promise<{ url: string; alt: string } | null> {
        if (!UNSPLASH_ACCESS_KEY) {
            return null;
        }

        try {
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
     * Generate placeholder image URL
     */
    private generatePlaceholderImage(searchTerm: string, width = 800, height = 600): { url: string; alt: string } {
        // Use Lorem Picsum with seed for consistent images
        const seed = searchTerm.replace(/\s+/g, '-').toLowerCase();
        return {
            url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
            alt: `Imagen de ${searchTerm}`
        };
    }

    /**
     * Upload image to Vercel Blob using the official SDK
     */
    private async uploadToBlob(imageUrl: string, productId: string, fileName: string): Promise<string | null> {
        if (!VERCEL_BLOB_TOKEN) {
            console.warn('Vercel Blob not configured, skipping upload');
            return imageUrl; // Return original URL as fallback
        }

        try {
            // Fetch the image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
            }

            const imageBlob = await imageResponse.blob();
            const pathname = `products/${productId}/${randomUUID()}-${fileName}`;

            // Upload to Vercel Blob using the official SDK
            const blob = await put(pathname, imageBlob, {
                access: 'public',
                token: VERCEL_BLOB_TOKEN,
            });

            return blob.url;
        } catch (error) {
            console.error('Error uploading to Vercel Blob:', error);
            return null;
        }
    }

    /**
     * Get images for a product category
     */
    async getImagesForCategory(categorySlug: string, productId: string, count = 3): Promise<ImageUploadResult[]> {
        const searchTerms = IMAGE_SEARCH_TERMS[categorySlug] || ['gift', 'product'];
        const results: ImageUploadResult[] = [];

        for (let i = 0; i < count; i++) {
            const searchTerm = searchTerms[i % searchTerms.length];
            let imageData: { url: string; alt: string } | null = null;

            // Try Unsplash first
            imageData = await this.fetchFromUnsplash(searchTerm);

            // Fallback to placeholder
            if (!imageData) {
                imageData = this.generatePlaceholderImage(searchTerm);
            }

            // Upload to Vercel Blob
            const fileName = `${searchTerm.replace(/\s+/g, '-')}-${i + 1}.jpg`;
            const uploadedUrl = await this.uploadToBlob(imageData.url, productId, fileName);

            if (uploadedUrl) {
                results.push({
                    url: uploadedUrl,
                    alt: imageData.alt,
                    success: true
                });
            } else {
                results.push({
                    url: imageData.url,
                    alt: imageData.alt,
                    success: false,
                    error: 'Upload failed, using original URL'
                });
            }

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return results;
    }

    /**
     * Get a single image for a product
     */
    async getImageForProduct(categorySlug: string, productId: string, productName: string): Promise<ImageUploadResult> {
        const searchTerms = IMAGE_SEARCH_TERMS[categorySlug] || ['gift'];
        const searchTerm = searchTerms[0];

        let imageData: { url: string; alt: string } | null = null;

        // Try Unsplash first
        imageData = await this.fetchFromUnsplash(searchTerm);

        // Fallback to placeholder
        if (!imageData) {
            imageData = this.generatePlaceholderImage(searchTerm);
        }

        // Upload to Vercel Blob
        const fileName = `${productName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
        const uploadedUrl = await this.uploadToBlob(imageData.url, productId, fileName);

        if (uploadedUrl) {
            return {
                url: uploadedUrl,
                alt: `${productName} - ${imageData.alt}`,
                success: true
            };
        } else {
            return {
                url: imageData.url,
                alt: `${productName} - ${imageData.alt}`,
                success: false,
                error: 'Upload failed, using original URL'
            };
        }
    }
}

export const imageService = ImageService.getInstance(); 