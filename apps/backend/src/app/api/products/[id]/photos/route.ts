import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { dbService, eq } from '@/db/service';
import { photos } from '@/db/schema';
import { StatusCodes } from 'http-status-codes';

// These environment variables should point to your Vercel Blob service
const BLOB_URL = process.env.VERCEL_BLOB_STORE_URL!;
const BLOB_TOKEN = process.env.VERCEL_BLOB_TOKEN!;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = id;

    // Validate productId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
        return NextResponse.json({ error: 'Invalid product id' }, { status: StatusCodes.BAD_REQUEST });
    }

    const items = await dbService.select(photos, eq(photos.productId, productId));
    return NextResponse.json(items, { status: StatusCodes.OK });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = id;
    // Validate UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(productId)) {
        return NextResponse.json({ error: 'Invalid product id' }, { status: StatusCodes.BAD_REQUEST });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const alt = formData.get('alt')?.toString() || '';
    const sortOrder = Number(formData.get('sortOrder')?.toString() || '0');

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: StatusCodes.BAD_REQUEST });
    }

    const fileType = file.type || 'application/octet-stream';
    const fileKey = `products/${productId}/${randomUUID()}-${file.name}`;

    // Upload to Vercel Blob
    const uploadRes = await fetch(BLOB_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${BLOB_TOKEN}`,
            'Content-Type': fileType,
            'x-vercel-blob-public': 'true',
            'x-vercel-blob-key': fileKey,
        },
        body: file.stream(),
    });

    if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        return NextResponse.json({ error: 'Blob upload failed', details: errText }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }

    const { url } = await uploadRes.json();

    // Save photo record
    const created = await dbService.insertReturning(photos,
        { url, alt, sortOrder, productId },
        { id: photos.id, url: photos.url, alt: photos.alt, sortOrder: photos.sortOrder, productId: photos.productId }
    );

    return NextResponse.json(created[0], { status: StatusCodes.CREATED });
} 