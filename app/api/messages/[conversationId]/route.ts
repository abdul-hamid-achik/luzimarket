import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConversationMessages, closeConversation } from "@/lib/services/messaging-service";

/**
 * GET /api/messages/[conversationId]
 * Get all messages in a conversation
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { conversationId } = await params;
        const userType = session.user.role === "vendor" ? "vendor" : "customer";
        const userId = session.user.id;

        const result = await getConversationMessages(conversationId, userId, userType);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.error === "Unauthorized" ? 403 : 404 }
            );
        }

        return NextResponse.json({
            success: true,
            messages: result.messages,
            conversation: result.conversation,
        });
    } catch (error) {
        console.error("Error fetching conversation messages:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/messages/[conversationId]
 * Close a conversation
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { conversationId } = await params;
        const userType = session.user.role === "vendor" ? "vendor" : "customer";
        const userId = session.user.id;

        const result = await closeConversation(conversationId, userId, userType);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: result.error === "Unauthorized" ? 403 : 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Conversation closed",
        });
    } catch (error) {
        console.error("Error closing conversation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

