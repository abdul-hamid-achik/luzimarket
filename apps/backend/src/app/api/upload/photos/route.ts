import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { StatusCodes } from 'http-status-codes';
import { dbService } from '@/db/service';
import { photos } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * @swagger
 * /api/upload/photos:
 *   post:
 *     summary: Upload a photo
 *     description: Upload a photo to Vercel Blob and optionally associate it with a product
 *     tags: [Upload, Photos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               productId:
 *                 type: string
 *                 description: Product ID to associate the photo with
 *               alt:
 *                 type: string
 *                 description: Alternative text for the image
 *               sortOrder:
 *                 type: number
 *                 description: Sort order for the photo
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *                 alt:
 *                   type: string
 *                 sortOrder:
 *                   type: number
 *                 productId:
 *                   type: string
 *       400:
 *         description: Bad request - no file provided
 *       500:
 *         description: Upload failed
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const productId = formData.get('productId') as string;
        const alt = formData.get('alt') as string;
        const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const pathname = `photos/${fileName}`;

        try {
            // Upload to Vercel Blob
            const blob = await put(pathname, file, {
                access: 'public',
                token: process.env.VERCEL_BLOB_TOKEN,
            });

            // Save photo record to database
            const photoRecord = {
                url: blob.url,
                alt: alt || '',
                sortOrder,
                productId: productId || null
            };

            const [savedPhoto] = await dbService.insertReturning(photos, photoRecord);

            return NextResponse.json(savedPhoto, { status: StatusCodes.CREATED });
        } catch (uploadError) {
            console.error('Error uploading to Vercel Blob:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: StatusCodes.INTERNAL_SERVER_ERROR }
            );
        }
    } catch (error) {
        console.error('Error in photo upload:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

/**
 * @swagger
 * /api/upload/photos:
 *   get:
 *     summary: Get all photos
 *     description: Retrieve all uploaded photos with optional product filtering
 *     tags: [Upload, Photos]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter photos by product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of photos to return
 *     responses:
 *       200:
 *         description: List of photos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   url:
 *                     type: string
 *                   alt:
 *                     type: string
 *                   sortOrder:
 *                     type: number
 *                   productId:
 *                     type: string
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = dbService.raw
            .select()
            .from(photos)
            .orderBy(photos.sortOrder);

        if (productId) {
            query = query.where(eq(photos.productId, productId));
        }

        const photoList = await query.limit(limit);

        return NextResponse.json(photoList, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch photos' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 