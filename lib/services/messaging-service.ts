import { db } from "@/db";
import { conversations, messages, users, vendors } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export interface CreateConversationData {
    customerId: string;
    vendorId: string;
    orderId?: string;
    subject: string;
    initialMessage: string;
}

export interface SendMessageData {
    conversationId: string;
    senderId: string;
    senderType: "customer" | "vendor" | "admin";
    content: string;
    attachments?: string[];
}

/**
 * Creates a new conversation
 */
export async function createConversation(data: CreateConversationData) {
    try {
        // Create conversation
        const [conversation] = await db
            .insert(conversations)
            .values({
                customerId: data.customerId,
                vendorId: data.vendorId,
                orderId: data.orderId,
                subject: data.subject,
                status: "open",
            })
            .returning();

        // Create initial message
        await db.insert(messages).values({
            conversationId: conversation.id,
            senderId: data.customerId,
            senderType: "customer",
            content: data.initialMessage,
        });

        // Notify vendor
        await notifyNewConversation(conversation, data.initialMessage);

        return {
            success: true,
            conversation,
        };
    } catch (error) {
        console.error("Error creating conversation:", error);
        return {
            success: false,
            error: "Failed to create conversation",
        };
    }
}

/**
 * Sends a message in a conversation
 */
export async function sendMessage(data: SendMessageData) {
    try {
        // Verify conversation exists
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, data.conversationId))
            .limit(1);

        if (!conversation) {
            return {
                success: false,
                error: "Conversation not found",
            };
        }

        // Verify sender is authorized
        if (data.senderType === "customer" && conversation.customerId !== data.senderId) {
            return {
                success: false,
                error: "Unauthorized",
            };
        }

        if (data.senderType === "vendor" && conversation.vendorId !== data.senderId) {
            return {
                success: false,
                error: "Unauthorized",
            };
        }

        // Create message
        const [message] = await db
            .insert(messages)
            .values({
                conversationId: data.conversationId,
                senderId: data.senderId,
                senderType: data.senderType,
                content: data.content,
                attachments: data.attachments,
            })
            .returning();

        // Update conversation last message time
        await db
            .update(conversations)
            .set({
                lastMessageAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(conversations.id, data.conversationId));

        // Notify recipient
        await notifyNewMessage(conversation, message, data.senderType);

        return {
            success: true,
            message,
        };
    } catch (error) {
        console.error("Error sending message:", error);
        return {
            success: false,
            error: "Failed to send message",
        };
    }
}

/**
 * Gets all conversations for a user (customer or vendor)
 */
export async function getConversations(
    userId: string,
    userType: "customer" | "vendor"
) {
    try {
        const conversationsData = await db
            .select({
                conversation: conversations,
                customer: users,
                vendor: vendors,
                lastMessage: sql<{
                    id: string;
                    content: string;
                    senderType: string;
                    createdAt: Date;
                }>`(
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'senderType', m.sender_type,
            'createdAt', m.created_at
          )
          FROM ${messages} m
          WHERE m.conversation_id = ${conversations.id}
          ORDER BY m.created_at DESC
          LIMIT 1
        )`,
                unreadCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${messages} m
          WHERE m.conversation_id = ${conversations.id}
            AND m.read_at IS NULL
            AND m.sender_type != ${userType}
        )`,
            })
            .from(conversations)
            .leftJoin(users, eq(conversations.customerId, users.id))
            .leftJoin(vendors, eq(conversations.vendorId, vendors.id))
            .where(
                userType === "customer"
                    ? eq(conversations.customerId, userId)
                    : eq(conversations.vendorId, userId)
            )
            .orderBy(desc(conversations.lastMessageAt));

        return {
            success: true,
            conversations: conversationsData,
        };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return {
            success: false,
            error: "Failed to fetch conversations",
            conversations: [],
        };
    }
}

/**
 * Gets messages for a conversation
 */
export async function getConversationMessages(conversationId: string, userId: string, userType: "customer" | "vendor") {
    try {
        // Verify user has access to this conversation
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, conversationId))
            .limit(1);

        if (!conversation) {
            return {
                success: false,
                error: "Conversation not found",
                messages: [],
            };
        }

        if (
            (userType === "customer" && conversation.customerId !== userId) ||
            (userType === "vendor" && conversation.vendorId !== userId)
        ) {
            return {
                success: false,
                error: "Unauthorized",
                messages: [],
            };
        }

        // Get messages
        const conversationMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(messages.createdAt);

        // Mark messages as read
        await db
            .update(messages)
            .set({ readAt: new Date() })
            .where(
                and(
                    eq(messages.conversationId, conversationId),
                    sql`${messages.senderType} != ${userType}`,
                    sql`${messages.readAt} IS NULL`
                )
            );

        return {
            success: true,
            messages: conversationMessages,
            conversation,
        };
    } catch (error) {
        console.error("Error fetching conversation messages:", error);
        return {
            success: false,
            error: "Failed to fetch messages",
            messages: [],
        };
    }
}

/**
 * Closes a conversation
 */
export async function closeConversation(conversationId: string, userId: string, userType: "customer" | "vendor") {
    try {
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, conversationId))
            .limit(1);

        if (!conversation) {
            return {
                success: false,
                error: "Conversation not found",
            };
        }

        // Verify authorization
        if (
            (userType === "customer" && conversation.customerId !== userId) ||
            (userType === "vendor" && conversation.vendorId !== userId)
        ) {
            return {
                success: false,
                error: "Unauthorized",
            };
        }

        await db
            .update(conversations)
            .set({
                status: "closed",
                updatedAt: new Date(),
            })
            .where(eq(conversations.id, conversationId));

        return { success: true };
    } catch (error) {
        console.error("Error closing conversation:", error);
        return {
            success: false,
            error: "Failed to close conversation",
        };
    }
}

/**
 * Notifies vendor of new conversation
 */
async function notifyNewConversation(conversation: any, initialMessage: string) {
    try {
        const [vendor] = await db
            .select({ email: vendors.email, businessName: vendors.businessName })
            .from(vendors)
            .where(eq(vendors.id, conversation.vendorId))
            .limit(1);

        if (!vendor?.email) return;

        const [customer] = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, conversation.customerId))
            .limit(1);

        const subject = `💬 Nuevo mensaje de cliente - ${conversation.subject}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">💬 Nuevo Mensaje de Cliente</h2>
        
        <p>Hola ${vendor.businessName},</p>
        
        <p>Has recibido un nuevo mensaje de <strong>${customer?.name || "un cliente"}</strong>.</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Asunto:</strong></p>
          <p style="margin: 8px 0 0 0;">${conversation.subject}</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>Mensaje:</strong></p>
          <p style="margin: 8px 0 0 0;">${initialMessage}</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/messages" 
           style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Ver y Responder Mensaje
        </a>
        
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          Responde pronto para mantener una excelente experiencia de cliente.
        </p>
      </div>
    `;

        await sendEmail({
            to: vendor.email,
            subject,
            html,
        });
    } catch (error) {
        console.error("Error notifying vendor of new conversation:", error);
    }
}

/**
 * Notifies recipient of new message
 */
async function notifyNewMessage(conversation: any, message: any, senderType: string) {
    try {
        // Determine recipient
        const isVendorSender = senderType === "vendor";

        let recipientEmail: string | null = null;
        let recipientName: string | null = null;

        if (isVendorSender) {
            // Notify customer
            const [customer] = await db
                .select({ email: users.email, name: users.name })
                .from(users)
                .where(eq(users.id, conversation.customerId))
                .limit(1);

            recipientEmail = customer?.email || null;
            recipientName = customer?.name || null;
        } else {
            // Notify vendor
            const [vendor] = await db
                .select({ email: vendors.email, businessName: vendors.businessName })
                .from(vendors)
                .where(eq(vendors.id, conversation.vendorId))
                .limit(1);

            recipientEmail = vendor?.email || null;
            recipientName = vendor?.businessName || null;
        }

        if (!recipientEmail) return;

        const subject = `💬 Nueva respuesta - ${conversation.subject}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>💬 Nueva Respuesta</h2>
        
        <p>Hola ${recipientName},</p>
        
        <p>Has recibido una nueva respuesta en tu conversación: <strong>${conversation.subject}</strong></p>
        
        <div style="background-color: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0;">${message.content}</p>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/${isVendorSender ? 'account' : 'vendor'}/messages" 
           style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Ver Mensaje
        </a>
      </div>
    `;

        await sendEmail({
            to: recipientEmail,
            subject,
            html,
        });
    } catch (error) {
        console.error("Error notifying new message:", error);
    }
}

