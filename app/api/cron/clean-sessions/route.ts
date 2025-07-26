import { NextResponse } from "next/server";
import { cleanExpiredSessions } from "@/lib/actions/session";

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (or allow in development)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanExpiredSessions();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Expired sessions cleaned successfully" 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in clean sessions cron:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}