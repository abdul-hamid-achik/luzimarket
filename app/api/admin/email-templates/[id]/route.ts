import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await props.params;
  try {
    const template = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, parseInt(params.id)))
      .limit(1);

    if (!template.length) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await props.params;
  try {
    const body = await request.json();
    const { subject, content } = body;

    await db
      .update(emailTemplates)
      .set({
        subject,
        content,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, parseInt(params.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}