// @ts-ignore: Allow jsonwebtoken import
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
// @ts-ignore: Allow http-status-codes import without type declarations
import { StatusCodes } from 'http-status-codes';
import { db } from '@/db';
import { sessions } from '@/db/schema';

export async function POST() {
    // create a guest session
    const insertResult = await db.insert(sessions).values({ isGuest: true }).returning({ id: sessions.id }).execute();
    const sessionId = insertResult[0].id;
    const token = jwt.sign({ sessionId, guest: true }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return NextResponse.json({ token }, { status: StatusCodes.OK });
} 