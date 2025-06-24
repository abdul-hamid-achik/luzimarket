import { NextRequest } from 'next/server';
import { 
  handleLocalBlobUpload, 
  handleLocalBlobDelete, 
  handleLocalBlobList 
} from '@/lib/blob-local';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 });
  }
  
  return handleLocalBlobUpload(request);
}

export async function DELETE(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 });
  }
  
  return handleLocalBlobDelete(request);
}

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 });
  }
  
  return handleLocalBlobList(request);
}