import { NextRequest, NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbService, eq } from '@/db/service';
import { editorialArticles } from '@/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = id;
  const article = await dbService.findFirst(editorialArticles, eq(editorialArticles.id, articleId));
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: StatusCodes.NOT_FOUND });
  }
  return NextResponse.json(article, { status: StatusCodes.OK });
}
