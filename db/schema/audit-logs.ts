import { pgTable, text, timestamp, uuid, json, index } from "drizzle-orm/pg-core";

// Audit Logs table for security and compliance tracking
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Event details
  action: text("action").notNull(), // e.g., "login", "order.create", "payment.failed"
  category: text("category").notNull(), // e.g., "auth", "order", "payment", "security"
  severity: text("severity").notNull().default("info"), // "info", "warning", "error", "critical"

  // User information
  userId: uuid("user_id"), // Can be null for anonymous actions
  userType: text("user_type"), // "user", "vendor", "admin", "guest"
  userEmail: text("user_email"),

  // Request details
  ip: text("ip").notNull(),
  userAgent: text("user_agent"),
  method: text("method"), // HTTP method
  path: text("path"), // Request path
  statusCode: text("status_code"), // Response status

  // Resource information
  resourceType: text("resource_type"), // e.g., "order", "product", "user"
  resourceId: text("resource_id"), // ID of the affected resource

  // Additional context
  details: json("details").$type<Record<string, any>>().default({}),
  metadata: json("metadata").$type<{
    browser?: string;
    os?: string;
    device?: string;
    country?: string;
    city?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number; // Request duration in ms
  }>().default({}),

  // Error information
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  actionIdx: index("audit_logs_action_idx").on(table.action),
  userIdx: index("audit_logs_user_idx").on(table.userId),
  categoryIdx: index("audit_logs_category_idx").on(table.category),
  severityIdx: index("audit_logs_severity_idx").on(table.severity),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;