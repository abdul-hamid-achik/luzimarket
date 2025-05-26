// @ts-ignore: Allow next-auth import without type declarations
import { NextAuthOptions } from 'next-auth';
// @ts-ignore: Allow credentials provider import without type declarations
import CredentialsProvider from 'next-auth/providers/credentials';
import { dbService, eq } from '@/db/service';
import { users } from '@/db/schema';
// @ts-ignore: Allow bcryptjs import without type declarations
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials: { email: string; password: string } | undefined) {
                if (!credentials) return null;
                const user = await dbService.findFirst(users, eq(users.email, credentials.email));
                if (!user) return null;
                const isValid = await compare(credentials.password, user.password);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user && (user as any).role) {
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.role) {
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/auth/login'
    }
}; 