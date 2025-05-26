import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { homepageSlides } from '@/db/schema';

import { StatusCodes } from 'http-status-codes';

// Force dynamic behavior for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * @swagger
 * /api/homepage-slides:
 *   get:
 *     summary: Get homepage carousel slides
 *     description: Retrieve active homepage carousel slides sorted by sort order
 *     tags: [Homepage]
 *     responses:
 *       200:
 *         description: List of active homepage slides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Slide ID
 *                   title:
 *                     type: string
 *                     description: Slide title
 *                     example: Special Offer
 *                   subtitle:
 *                     type: string
 *                     description: Slide subtitle
 *                     example: Up to 50% off
 *                   description:
 *                     type: string
 *                     description: Slide description
 *                   imageUrl:
 *                     type: string
 *                     description: Slide background image URL
 *                   buttonText:
 *                     type: string
 *                     description: Call-to-action button text
 *                     example: Shop Now
 *                   buttonLink:
 *                     type: string
 *                     description: Call-to-action button link
 *                     example: /products
 *                   backgroundColor:
 *                     type: string
 *                     description: Slide background color
 *                     example: "#ffffff"
 *                   textColor:
 *                     type: string
 *                     description: Slide text color
 *                     example: "#000000"
 *                   position:
 *                     type: string
 *                     description: Text position on slide
 *                     example: center
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the slide is active
 *                   sortOrder:
 *                     type: number
 *                     description: Sort order for slide display
 *       500:
 *         description: Failed to fetch homepage slides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new homepage slide
 *     description: Create a new carousel slide for the homepage
 *     tags: [Homepage]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *                 description: Slide title
 *                 example: Special Offer
 *               subtitle:
 *                 type: string
 *                 description: Slide subtitle
 *                 example: Up to 50% off
 *               description:
 *                 type: string
 *                 description: Slide description
 *               imageUrl:
 *                 type: string
 *                 description: Slide background image URL
 *                 example: https://example.com/image.jpg
 *               buttonText:
 *                 type: string
 *                 description: Call-to-action button text
 *                 example: Shop Now
 *               buttonLink:
 *                 type: string
 *                 description: Call-to-action button link
 *                 example: /products
 *               backgroundColor:
 *                 type: string
 *                 description: Slide background color
 *                 default: "#ffffff"
 *                 example: "#ffffff"
 *               textColor:
 *                 type: string
 *                 description: Slide text color
 *                 default: "#000000"
 *                 example: "#000000"
 *               position:
 *                 type: string
 *                 description: Text position on slide
 *                 default: center
 *                 enum: [left, center, right]
 *               isActive:
 *                 type: boolean
 *                 description: Whether the slide should be active
 *                 default: true
 *               sortOrder:
 *                 type: number
 *                 description: Sort order for slide display
 *                 default: 0
 *     responses:
 *       201:
 *         description: Slide created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Created slide ID
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Title and image URL are required
 *       500:
 *         description: Failed to create homepage slide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
    try {
        const slides = await dbService.selectFields(
            {
                id: homepageSlides.id,
                title: homepageSlides.title,
                subtitle: homepageSlides.subtitle,
                description: homepageSlides.description,
                imageUrl: homepageSlides.imageUrl,
                buttonText: homepageSlides.buttonText,
                buttonLink: homepageSlides.buttonLink,
                backgroundColor: homepageSlides.backgroundColor,
                textColor: homepageSlides.textColor,
                position: homepageSlides.position,
                isActive: homepageSlides.isActive,
                sortOrder: homepageSlides.sortOrder
            },
            homepageSlides,
            eq(homepageSlides.isActive, true)
        );

        // Sort by sortOrder descending (highest first)
        const sortedSlides = slides.sort((a: any, b: any) => b.sortOrder - a.sortOrder);

        return NextResponse.json(sortedSlides, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching homepage slides:', error);
        return NextResponse.json(
            { error: 'Failed to fetch homepage slides' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.title || !data.imageUrl) {
            return NextResponse.json(
                { error: 'Title and image URL are required' },
                { status: StatusCodes.BAD_REQUEST }
            );
        }

        const [newSlide] = await dbService.insertReturning(homepageSlides, {
            title: data.title,
            subtitle: data.subtitle || null,
            description: data.description || null,
            imageUrl: data.imageUrl,
            buttonText: data.buttonText || null,
            buttonLink: data.buttonLink || null,
            backgroundColor: data.backgroundColor || '#ffffff',
            textColor: data.textColor || '#000000',
            position: data.position || 'center',
            isActive: data.isActive !== undefined ? data.isActive : true,
            sortOrder: data.sortOrder || 0
        });

        return NextResponse.json(newSlide, { status: StatusCodes.CREATED });
    } catch (error) {
        console.error('Error creating homepage slide:', error);
        return NextResponse.json(
            { error: 'Failed to create homepage slide' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 