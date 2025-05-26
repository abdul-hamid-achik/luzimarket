import { NextResponse } from 'next/server';
import { dbService } from '@/db/service';
import { editorialArticles } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

/**
 * @swagger
 * /api/editorial:
 *   get:
 *     summary: Get editorial articles
 *     description: Retrieve a list of all editorial articles and content for the platform
 *     tags: [Editorial]
 *     responses:
 *       200:
 *         description: List of editorial articles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Article ID
 *                   title:
 *                     type: string
 *                     description: Article title
 *                     example: "5 Tips for Healthy Eating"
 *                   slug:
 *                     type: string
 *                     description: URL-friendly article identifier
 *                     example: "5-tips-for-healthy-eating"
 *                   content:
 *                     type: string
 *                     description: Article content in HTML or markdown
 *                   excerpt:
 *                     type: string
 *                     description: Short excerpt or summary of the article
 *                   authorId:
 *                     type: string
 *                     description: ID of the article author
 *                   authorName:
 *                     type: string
 *                     description: Name of the article author
 *                   categoryId:
 *                     type: string
 *                     description: Article category ID
 *                   categoryName:
 *                     type: string
 *                     description: Article category name
 *                   featuredImage:
 *                     type: string
 *                     description: URL of the featured image
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Article tags
 *                   isPublished:
 *                     type: boolean
 *                     description: Whether the article is published
 *                   isFeatured:
 *                     type: boolean
 *                     description: Whether the article is featured
 *                   publishedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Article publication date
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Article creation date
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Article last update date
 *       500:
 *         description: Failed to fetch editorial articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    const items = await dbService.select(editorialArticles);
    return NextResponse.json(items, { status: StatusCodes.OK });
} 