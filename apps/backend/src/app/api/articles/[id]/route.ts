import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { editorialArticles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = id;
  const [article] = await db.select().from(editorialArticles).where(eq(editorialArticles.id, articleId));
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: StatusCodes.NOT_FOUND });
  }
  return NextResponse.json(article, { status: StatusCodes.OK });
}
