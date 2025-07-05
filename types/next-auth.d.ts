import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `auth`, contains information about the active session.
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string;
      /** The user's role: customer, vendor, or admin */
      role: "customer" | "vendor" | "admin";
      /** Vendor information when user is a vendor */
      vendor?: {
        id: string;
        businessName?: string;
        contactName?: string;
        email: string;
        isActive: boolean;
      };
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    email: string;
    name: string;
    role: "customer" | "vendor" | "admin";
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** The user's unique identifier */
    id: string;
    /** The user's role: customer, vendor, or admin */
    role: "customer" | "vendor" | "admin";
  }
}