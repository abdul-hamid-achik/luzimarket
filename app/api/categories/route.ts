import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
    try {
        const list = await db
            .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                displayOrder: sql<number>`COALESCE(${categories.displayOrder}, 0)`,
            })
            .from(categories)
            .where(eq(categories.isActive, true))
            .orderBy(categories.displayOrder, categories.name);

        return NextResponse.json(
            list.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
        );
    } catch (error) {
        return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
    }
}


