import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Export runtime to fix potential edge runtime issues
export const runtime = 'nodejs';