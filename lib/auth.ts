import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, getDbInstance } from "@/db";
import { users, vendors, adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(["customer", "vendor", "admin"]),
});

export const authOptions = {
  // Only use adapter when DATABASE_URL is available (not during build)
  ...(process.env.DATABASE_URL ? { adapter: DrizzleAdapter(getDbInstance()) } : {}),
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { email, password, userType } = loginSchema.parse(credentials);
          
          // Import the authenticateUser function dynamically to avoid circular dependencies
          const { authenticateUser } = await import("@/lib/actions/auth");
          
          const result = await authenticateUser(email, password, userType);
          
          if (!result.success) {
            // NextAuth expects null for failed authentication
            // The error message will be handled by the login page
            return null;
          }
          
          return result.user || null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        
        // If user is a vendor, fetch vendor details
        if (token.role === "vendor" && process.env.DATABASE_URL) {
          try {
            const [vendor] = await db
              .select()
              .from(vendors)
              .where(eq(vendors.id, token.id))
              .limit(1);
            
            if (vendor) {
              session.user.vendor = {
                id: vendor.id,
                businessName: vendor.businessName,
                contactName: vendor.contactName,
                email: vendor.email,
                isActive: vendor.isActive,
              };
            }
          } catch (error) {
            console.error("Error fetching vendor details:", error);
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);