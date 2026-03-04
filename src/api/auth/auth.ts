import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error('GitHub OAuth credentials are not configured');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.providerAccountId || !user.email) {
        return false;
      }

      try {
        // Verificar se o usuário já existe
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.githubId, account.providerAccountId))
          .limit(1);

        if (existingUser.length === 0) {
          // Criar novo usuário
          await db.insert(users).values({
            githubId: account.providerAccountId,
            name: user.name || undefined,
            email: user.email,
            avatar: user.image || undefined,
          });
        } else {
          // Atualizar usuário existente
          await db
            .update(users)
            .set({
              name: user.name || undefined,
              avatar: user.image || undefined,
              updatedAt: new Date(),
            })
            .where(eq(users.githubId, account.providerAccountId));
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.githubId, token.sub))
            .limit(1);

          if (dbUser.length > 0) {
            session.user.id = dbUser[0].id.toString();
          }
        } catch (error) {
          console.error('Error in session callback:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};
