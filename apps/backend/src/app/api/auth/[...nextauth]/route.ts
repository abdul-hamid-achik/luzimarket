// @ts-ignore: Allow next-auth import without type declarations
import NextAuth, { NextAuthOptions } from 'next-auth';
// @ts-ignore: Allow credentials provider import without type declarations
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
// @ts-ignore: Allow bcryptjs import without type declarations
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials: { email: string; password: string } | undefined) {
                if (!credentials) return null;
                const [user] = await db.select().from(users).where(eq(users.email, credentials.email));
                if (!user) return null;
                const isValid = await compare(credentials.password, user.password);
                if (!isValid) return null;
                return { id: user.id.toString(), email: user.email, name: user.name, role: user.role };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 