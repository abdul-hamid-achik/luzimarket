import { NextRequest, NextResponse } from 'next/server';
import { dbService, eq } from '@/db/service';
import { homepageSlides } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();

        // Check if slide exists
        const existingSlide = await dbService.findFirst(
            homepageSlides,
            eq(homepageSlides.id, id)
        );

        if (!existingSlide) {
            return NextResponse.json(
                { error: 'Slide not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Update slide
        await dbService.update(
            homepageSlides,
            {
                title: data.title,
                subtitle: data.subtitle,
                description: data.description,
                imageUrl: data.imageUrl,
                buttonText: data.buttonText,
                buttonLink: data.buttonLink,
                backgroundColor: data.backgroundColor,
                textColor: data.textColor,
                position: data.position,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
                updatedAt: new Date()
            },
            eq(homepageSlides.id, id)
        );

        // Get updated slide
        const updatedSlide = await dbService.findFirst(
            homepageSlides,
            eq(homepageSlides.id, id)
        );

        return NextResponse.json(updatedSlide, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error updating homepage slide:', error);
        return NextResponse.json(
            { error: 'Failed to update homepage slide' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if slide exists
        const existingSlide = await dbService.findFirst(
            homepageSlides,
            eq(homepageSlides.id, id)
        );

        if (!existingSlide) {
            return NextResponse.json(
                { error: 'Slide not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        // Delete slide
        await dbService.delete(homepageSlides, eq(homepageSlides.id, id));

        return NextResponse.json(
            { message: 'Slide deleted successfully' },
            { status: StatusCodes.OK }
        );
    } catch (error) {
        console.error('Error deleting homepage slide:', error);
        return NextResponse.json(
            { error: 'Failed to delete homepage slide' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const slide = await dbService.findFirst(
            homepageSlides,
            eq(homepageSlides.id, id)
        );

        if (!slide) {
            return NextResponse.json(
                { error: 'Slide not found' },
                { status: StatusCodes.NOT_FOUND }
            );
        }

        return NextResponse.json(slide, { status: StatusCodes.OK });
    } catch (error) {
        console.error('Error fetching homepage slide:', error);
        return NextResponse.json(
            { error: 'Failed to fetch homepage slide' },
            { status: StatusCodes.INTERNAL_SERVER_ERROR }
        );
    }
} 