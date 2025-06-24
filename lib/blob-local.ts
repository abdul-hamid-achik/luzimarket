/**
 * Local development server for Vercel Blob storage
 * This simulates the Vercel Blob API locally
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

export async function handleLocalBlobUpload(request: NextRequest) {
  await ensureUploadsDir();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pathname = formData.get('pathname') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const ext = path.extname(file.name);
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const filename = pathname 
      ? `${pathname.replace(/\.[^/.]+$/, '')}-${randomSuffix}${ext}`
      : `${file.name.replace(/\.[^/.]+$/, '')}-${randomSuffix}${ext}`;
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.writeFile(filePath, buffer);
    
    // Return blob-like response
    const url = `/uploads/${filename}`;
    return NextResponse.json({
      url,
      pathname: url,
      contentType: file.type,
      contentDisposition: `attachment; filename="${filename}"`,
    });
  } catch (error) {
    console.error('Error handling blob upload:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function handleLocalBlobDelete(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }
    
    const filename = url.split('/').pop();
    if (!filename) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(UPLOADS_DIR, filename);
    await fs.unlink(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blob:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}

export async function handleLocalBlobList(request: NextRequest) {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const blobs = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          pathname: `/uploads/${file}`,
          url: `/uploads/${file}`,
          downloadUrl: `/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime,
        };
      })
    );
    
    return NextResponse.json({
      blobs,
      cursor: null,
      hasMore: false,
    });
  } catch (error) {
    console.error('Error listing blobs:', error);
    return NextResponse.json({
      blobs: [],
      cursor: null,
      hasMore: false,
    });
  }
}