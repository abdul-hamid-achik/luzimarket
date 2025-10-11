import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createConversation, getConversations, sendMessage } from "@/lib/services/messaging-service";
import { z } from "zod";

const createConversationSchema = z.object({
    vendorId: z.string().uuid(),
    orderId: z.string().uuid().optional(),
    subject: z.string().min(3),
    initialMessage: z.string().min(10),
});

const sendMessageSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1),
    attachments: z.array(z.string()).optional(),
});

/**
 * GET /api/messages
 * Get all conversations for the logged-in user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userType = session.user.role === "vendor" ? "vendor" : "customer";
        const userId = session.user.id;

        const result = await getConversations(userId, userType);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            conversations: result.conversations,
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/messages
 * Create a new conversation or send a message
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action } = body;

        if (action === "create_conversation") {
            const validation = createConversationSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json(
                    { error: "Invalid request data", details: validation.error.errors },
                    { status: 400 }
                );
            }

            const result = await createConversation({
                customerId: session.user.id,
                vendorId: validation.data.vendorId,
                orderId: validation.data.orderId,
                subject: validation.data.subject,
                initialMessage: validation.data.initialMessage,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                conversation: result.conversation,
            });
        }

        if (action === "send_message") {
            const validation = sendMessageSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json(
                    { error: "Invalid request data", details: validation.error.errors },
                    { status: 400 }
                );
            }

            const userType = session.user.role === "vendor" ? "vendor" : "customer";

            const result = await sendMessage({
                conversationId: validation.data.conversationId,
                senderId: session.user.id,
                senderType: userType,
                content: validation.data.content,
                attachments: validation.data.attachments,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: result.message,
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error handling message request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

