import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, vendors, adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Custom error class for invalid credentials
class InvalidLoginError extends CredentialsSignin {
  code = "Invalid credentials"
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(["customer", "vendor", "admin"]),
});

export const authOptions = {
  // Credentials provider requires JWT sessions - cannot use database adapter with credentials
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
      async authorize(credentials, req) {
        try {
          console.log("Authorize called with credentials:", credentials);
          console.log("Request:", req ? "Present" : "Not present");
          
          if (!credentials) {
            console.error("No credentials provided");
            throw new InvalidLoginError();
          }

          // Handle different credential formats in NextAuth v5 beta
          let parsedCredentials = credentials;
          
          // If credentials is a string or seems to be form data, try to parse it differently
          if (typeof credentials === 'string') {
            console.log("Credentials is a string, trying to parse");
            try {
              parsedCredentials = JSON.parse(credentials);
            } catch {
              // If JSON parsing fails, treat as invalid
              throw new InvalidLoginError();
            }
          }

          // Validate credentials with Zod schema
          const { email, password, userType } = loginSchema.parse(parsedCredentials);
          
          // Import the authenticateUser function dynamically to avoid circular dependencies
          const { authenticateUser } = await import("@/lib/actions/auth");
          
          const result = await authenticateUser(email, password, userType);
          
          if (!result.success) {
            // Throw custom error for better error handling
            console.error("Authentication failed:", result.error);
            throw new InvalidLoginError();
          }
          
          return result.user || null;
        } catch (error) {
          console.error("Auth error:", error);
          if (error instanceof InvalidLoginError) {
            throw error;
          }
          // For other errors, throw invalid login
          throw new InvalidLoginError();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as "customer" | "vendor" | "admin";
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        
        // If user is a vendor, fetch vendor details
        if (token.role === "vendor") {
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