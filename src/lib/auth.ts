import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: 'oidc',
      name: 'Cornell',
      type: 'oauth',
      wellKnown: 'https://shibidp.cit.cornell.edu/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid profile email' } },
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
    },
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });
      if (!dbUser) {
        console.log(`[AUTH] Denying sign-in for unapproved user: ${user.email}`);
        return false;
      }
      console.log(`[AUTH] Allowing sign-in for approved user: ${user.email}`);
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },
  debug: true,
  pages: {
    signIn: '/login',
  },
};

