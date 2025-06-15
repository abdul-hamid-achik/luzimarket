import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, vendors, adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(["customer", "vendor", "admin"]),
});

export const authOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
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

          let user;
          let hashedPassword;

          switch (userType) {
            case "customer":
              const customer = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1);
              
              if (customer.length === 0) return null;
              user = customer[0];
              hashedPassword = user.passwordHash;
              break;

            case "vendor":
              const vendor = await db
                .select()
                .from(vendors)
                .where(eq(vendors.email, email))
                .limit(1);
              
              if (vendor.length === 0) return null;
              user = vendor[0];
              // For vendors, we'll need to add password field to schema
              // For now, vendors register and admin approves
              return null;

            case "admin":
              const admin = await db
                .select()
                .from(adminUsers)
                .where(eq(adminUsers.email, email))
                .limit(1);
              
              if (admin.length === 0) return null;
              user = admin[0];
              hashedPassword = user.passwordHash;
              break;

            default:
              return null;
          }

          if (!hashedPassword || !user.isActive) return null;

          const isValid = await bcrypt.compare(password, hashedPassword);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.businessName || user.email,
            role: userType,
          };
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
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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