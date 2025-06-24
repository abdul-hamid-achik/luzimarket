import { put, del, list, head } from '@vercel/blob';

// For local development, we'll use a mock implementation
const isLocal = process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN;

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

/**
 * Upload a file to Vercel Blob storage
 * In local development without token, saves to public directory
 */
export async function uploadBlob(
  pathname: string,
  file: File | Buffer | ReadableStream | ArrayBuffer | Blob,
  options?: {
    contentType?: string;
    cacheControlMaxAge?: number;
  }
): Promise<BlobUploadResult> {
  if (isLocal) {
    // For local development, save to public directory
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(publicDir, { recursive: true });
    
    const filename = pathname.split('/').pop() || 'file';
    const filePath = path.join(publicDir, filename);
    
    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
    } else if (Buffer.isBuffer(file)) {
      await fs.writeFile(filePath, file);
    } else if (file instanceof ArrayBuffer) {
      await fs.writeFile(filePath, Buffer.from(file));
    } else if (file instanceof Blob) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
    }
    
    return {
      url: `/uploads/${filename}`,
      pathname: `/uploads/${filename}`,
      contentType: options?.contentType || 'application/octet-stream',
      contentDisposition: `attachment; filename="${filename}"`,
    };
  }
  
  // Production: Use Vercel Blob
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
    cacheControlMaxAge: options?.cacheControlMaxAge,
  });
  
  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    contentDisposition: blob.contentDisposition,
  };
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteBlob(url: string): Promise<void> {
  if (isLocal) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filename = url.split('/').pop();
    if (!filename) return;
    
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
    return;
  }
  
  await del(url);
}

/**
 * List files in Vercel Blob storage
 */
export async function listBlobs(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}) {
  if (isLocal) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      const files = await fs.readdir(publicDir);
      return {
        blobs: files.map(file => ({
          pathname: `/uploads/${file}`,
          url: `/uploads/${file}`,
          downloadUrl: `/uploads/${file}`,
          size: 0,
          uploadedAt: new Date(),
        })),
        cursor: null,
        hasMore: false,
      };
    } catch {
      return {
        blobs: [],
        cursor: null,
        hasMore: false,
      };
    }
  }
  
  return await list(options);
}

/**
 * Get metadata for a blob
 */
export async function getBlobMetadata(url: string) {
  if (isLocal) {
    return {
      url,
      downloadUrl: url,
      pathname: url,
      contentType: 'application/octet-stream',
      contentDisposition: 'attachment',
      cacheControl: 'public, max-age=31536000',
      uploadedAt: new Date(),
      size: 0,
    };
  }
  
  return await head(url);
}