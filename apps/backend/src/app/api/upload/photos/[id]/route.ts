import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { photos } from '@/db/schema';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/upload/photos/{id}:
 *   delete:
 *     summary: Delete photo by ID
 *     description: Delete a specific photo from the database and storage
 *     tags: [Upload, Photos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *       404:
 *         description: Photo not found
 *       500:
 *         description: Failed to delete photo
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check if photo exists
        const existingPhoto = await dbService.findFirst(photos, eq(photos.id, id));
        if (!existingPhoto) {
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Delete photo from database
        await dbService.delete(photos, eq(photos.id, id));

        // Note: In a production environment, you might also want to delete the actual file
        // from Vercel Blob storage using their API. For now, we're only removing the database record.
        // You can add Vercel Blob deletion logic here if needed:
        // 
        // try {
        //     await del(existingPhoto.url, {
        //         token: process.env.VERCEL_BLOB_TOKEN,
        //     });
        // } catch (storageError) {
        //     console.warn('Failed to delete from storage, but database record was removed');
        // }

        return NextResponse.json(
            { message: 'Photo deleted successfully' },
            { status: StatusCodes.OK }
        );
    } catch (error) {
        console.error('Error deleting photo:', error);
        return NextResponse.json(
            { error: 'Failed to delete photo' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 